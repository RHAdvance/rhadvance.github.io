(function() {
	var canvas = document.getElementById("rapmachine-canvas");
	if (!canvas || !canvas.getContext) {
		return;
	}

	var ctx = canvas.getContext("2d");
	var bgImage = new Image();
	var spritesImage = new Image();
	var isSongRunning = false;
	var intro = new Audio("assets/intro.mp3");
	var loop = new Audio("assets/loop.mp3");
	var un = new Audio("assets/un.mp3");
	var unn = new Audio("assets/unn.mp3");

	// Red rapmen sample tables (edit filenames as needed)
	var leftSamples = ["assets/left_3pm.mp3", "assets/left_getit.mp3", "assets/left_snacktime.mp3"];
	var rightSamples = ["assets/right.mp3"];
	var upSamples = ["assets/up.mp3"];
	var currentRedAudio = null;

	intro.preload = "auto";
	loop.preload = "auto";
	un.preload = "auto";
	unn.preload = "auto";
	loop.loop = true;

	var rapmenRed = {
		x: 190,
		y: 62,
		idle: { sx: 0, sy: 124, w: 70, h: 100 },
		currentAnimation: null,
		animationFrame: 0
	};

	var rapmenYellow = {
		x: 226,
		y: 38,
		idle: { sx: 0, sy: 0, w: 112, h: 124 },
		currentAnimation: null,
		animationFrame: 0
	};

	var redAnimation = [
		{ sx: 70, sy: 124, w: 70, h: 100, frames: 4 },
		{ sx: 140, sy: 124, w: 70, h: 100, frames: 4 },
		{ sx: 210, sy: 124, w: 70, h: 100, frames: 100 }
	];

	var yellowAnimation = [
		{ sx: 112, sy: 0, w: 112, h: 124, frames: 4 },
		{ sx: 224, sy: 0, w: 112, h: 124, frames: 4 },
		{ sx: 336, sy: 0, w: 112, h: 124, frames: 4 }
	];

	function drawFallback() {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	function drawBackground() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
	}

	function drawSprite(sprite, frame) {
		if (!spritesImage.complete) {
			return;
		}
		ctx.drawImage(
			spritesImage,
			frame.sx, frame.sy, frame.w, frame.h,
			sprite.x, sprite.y, frame.w, frame.h
		);
	}

	function playAnimation(sprite, animationFrames) {
		sprite.currentAnimation = animationFrames;
		sprite.animationFrame = 0;
	}



	const FRAME_RATE = 60;
	const FRAME_MS = 1000 / FRAME_RATE;
	var rafId = null;
	var lastTime = 0;
	var accumulator = 0;

	function updateSpritesState(deltaFrames) {
		// advance yellow
		if (rapmenYellow.currentAnimation) {
			rapmenYellow.animationFrame += deltaFrames;
			var totalFrames = 0;
			for (var i = 0; i < rapmenYellow.currentAnimation.length; i++) {
				totalFrames += rapmenYellow.currentAnimation[i].frames;
			}
			if (rapmenYellow.animationFrame >= totalFrames) {
				rapmenYellow.currentAnimation = null;
				rapmenYellow.animationFrame = 0;
			}
		}
		// advance red
		if (rapmenRed.currentAnimation) {
			rapmenRed.animationFrame += deltaFrames;
			var totalFrames = 0;
			for (var i = 0; i < rapmenRed.currentAnimation.length; i++) {
				totalFrames += rapmenRed.currentAnimation[i].frames;
			}
			if (rapmenRed.animationFrame >= totalFrames) {
				rapmenRed.currentAnimation = null;
				rapmenRed.animationFrame = 0;
			}
		}
	}

	function getCurrentFrame(sprite) {
		if (!sprite.currentAnimation) return sprite.idle;
		var af = sprite.animationFrame;
		var cum = 0;
		for (var i = 0; i < sprite.currentAnimation.length; i++) {
			cum += sprite.currentAnimation[i].frames;
			if (af < cum) return sprite.currentAnimation[i];
		}
		return sprite.idle;
	}

	function renderSprites() {
		drawSprite(rapmenYellow, getCurrentFrame(rapmenYellow));
		drawSprite(rapmenRed, getCurrentFrame(rapmenRed));
	}

	function rafLoop(timestamp) {
		if (!lastTime) lastTime = timestamp;
		var delta = timestamp - lastTime;
		if (delta > 250) delta = 250;
		lastTime = timestamp;
		accumulator += delta;
		while (accumulator >= FRAME_MS) {
			updateSpritesState(1);
			accumulator -= FRAME_MS;
		}
		drawBackground();
		renderSprites();
		rafId = requestAnimationFrame(rafLoop);
	}

	function startAnimationLoop() {
		if (rafId !== null) return;
		lastTime = 0;
		accumulator = 0;
		rafId = requestAnimationFrame(rafLoop);
	}

	function stopAnimationLoop() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function stopSong() {
		intro.pause();
		loop.pause();
		intro.currentTime = 0;
		loop.currentTime = 0;
		isSongRunning = false;
	}

	function startSong() {
		stopSong();
		isSongRunning = true;
		intro.play().catch(function() {
			isSongRunning = false;
		});
	}

	function toggleSong() {
		if (isSongRunning) {
			stopSong();
			return;
		}
		startSong();
	}

	function playShot(audio) {
		audio.pause();
		audio.currentTime = 0;
		audio.play().catch(function() {});
	}

	function playRedSampleFrom(table) {
		if (!table || table.length === 0) return;
		if (currentRedAudio) {
			try { currentRedAudio.pause(); currentRedAudio.currentTime = 0; } catch (e) {}
		}
		var url = table[Math.floor(Math.random() * table.length)];
		currentRedAudio = new Audio(url);
		currentRedAudio.preload = 'auto';
		currentRedAudio.play().catch(function() {});
	}

	intro.addEventListener("ended", function() {
		if (!isSongRunning) {
			return;
		}
		loop.currentTime = 0;
		loop.play().catch(function() {
			isSongRunning = false;
		});
	});

	bgImage.addEventListener("load", drawBackground);
	bgImage.addEventListener("error", drawFallback);
	bgImage.src = "assets/bg.png";
	
	spritesImage.addEventListener("load", startAnimationLoop);
	spritesImage.src = "assets/sprites.png";
	
	drawFallback();

	document.addEventListener("keydown", function(event) {
		if (event.repeat) {
			return;
		}

		if (event.code === "Enter" || event.key === "Enter") {
			event.preventDefault();
			toggleSong();
			return;
		}

		if (event.code === "KeyZ" || event.key === "z" || event.key === "Z") {
			event.preventDefault();
			playShot(un);
			playAnimation(rapmenYellow, yellowAnimation);
			return;
		}

		if (event.code === "KeyX" || event.key === "x" || event.key === "X") {
			event.preventDefault();
			playShot(unn);
			playAnimation(rapmenYellow, yellowAnimation);
			return;
		}

		if (event.code === "ArrowLeft") {
			event.preventDefault();
			playRedSampleFrom(leftSamples);
			playAnimation(rapmenRed, redAnimation);
			return;
		}

		if (event.code === "ArrowRight") {
			event.preventDefault();
			playRedSampleFrom(rightSamples);
			playAnimation(rapmenRed, redAnimation);
			return;
		}

		if (event.code === "ArrowUp") {
			event.preventDefault();
			playRedSampleFrom(upSamples);
			playAnimation(rapmenRed, redAnimation);
		}
	});

	var enterButton = document.getElementById("btn-enter");
	var zButton = document.getElementById("btn-z");
	var xButton = document.getElementById("btn-x");
	var leftButton = document.getElementById("btn-left");
	var rightButton = document.getElementById("btn-right");
	var upButton = document.getElementById("btn-up");

	if (enterButton) {
		enterButton.addEventListener("click", toggleSong);
	}
	if (zButton) {
		zButton.addEventListener("click", function() {
			playShot(un);
			playAnimation(rapmenYellow, yellowAnimation);
		});
	}
	if (xButton) {
		xButton.addEventListener("click", function() {
			playShot(unn);
			playAnimation(rapmenYellow, yellowAnimation);
		});
	}
	if (leftButton) {
		leftButton.addEventListener("click", function() {
			playRedSampleFrom(leftSamples);
			playAnimation(rapmenRed, redAnimation);
		});
	}
	if (rightButton) {
		rightButton.addEventListener("click", function() {
			playRedSampleFrom(rightSamples);
			playAnimation(rapmenRed, redAnimation);
		});
	}
	if (upButton) {
		upButton.addEventListener("click", function() {
			playRedSampleFrom(upSamples);
			playAnimation(rapmenRed, redAnimation);
		});
	}
})();

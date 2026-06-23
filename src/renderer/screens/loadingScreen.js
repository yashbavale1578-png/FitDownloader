// Loading Screen
class LoadingScreen {
  constructor() {
    this.container = document.querySelector('.loading-container');
    this.logo = document.querySelector('.loading-logo');
    this.bar = document.querySelector('.loading-bar');
    this.subtitle = document.querySelector('.loading-subtitle');
    this.progress = 0;
  }

  async show() {
    return new Promise(async (resolve) => {
      // Phase 1: Glitch animation (handled by CSS)
      await Utils.sleep(500);
      this.logo.classList.add('glitch-active');

      // Phase 2: Progress bar
      await Utils.sleep(800);
      await this.animateProgress();

      // Phase 3: Typewriter intro
      await Utils.sleep(300);
      await this.typeWriter("What's up! What's your next download? ⚡");

      // Phase 4: Fade out
      await Utils.sleep(1000);
      this.container.classList.add('fade-out');
      await Utils.sleep(600);
      
      resolve();
    });
  }

  async animateProgress() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        this.progress += Math.random() * 15 + 5;
        if (this.progress >= 100) {
          this.progress = 100;
          this.bar.style.width = '100%';
          clearInterval(interval);
          resolve();
        } else {
          this.bar.style.width = `${this.progress}%`;
        }
      }, 100);
    });
  }

  async typeWriter(text) {
    return new Promise((resolve) => {
      let i = 0;
      this.subtitle.textContent = '';
      this.subtitle.classList.add('typing');
      
      const interval = setInterval(() => {
        if (i < text.length) {
          this.subtitle.textContent += text.charAt(i);
          i++;
        } else {
          this.subtitle.classList.remove('typing');
          clearInterval(interval);
          resolve();
        }
      }, 40);
    });
  }
}

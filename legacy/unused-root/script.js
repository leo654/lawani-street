// WORK IN PROGRESS!!
// inspired by animation from @matvoyce
// https://www.instagram.com/p/CFK-kEdB1yg/
// and demo from https://www.williamrchase.com/scroll_trigger_demo/index.html

gsap.registerPlugin(SplitText, ScrollTrigger);

const tl = gsap.timeline();
let direction = 1;

gsap.utils.toArray(".animatedText h1").forEach(function (el, i) {
  split = new SplitText(el, { type: "chars" });
  tl.to(split.chars, {
    scrollTrigger: {
      trigger: ".animatedText",
      start: "100% 50%",
      end: "100% center-=150",
      //markers: true,
      scrub: (7 - i) * 0.1,
      onUpdate: (self) => {
        direction = self.direction;
      }
    },
    y: -50 + "vh",
    stagger: 0.05
  });
});
import type { GameObj } from "kaplay";
import { k } from "../lib/kaplayCtx";
import { gameManager } from "../gameManager";
import { COLORS, PLAYER_COLORS } from "../constants";

export function makeDuck(duckId: string, speed: number) {
  const startingPos = [
    k.vec2(80, k.center().y + 40),
    k.vec2(k.center().x, k.center().y + 40),
    k.vec2(200, k.center().y + 40),
  ];

  const flyDirections = [k.vec2(-1, -1), k.vec2(1, -1), k.vec2(1, -1)];

  const chosenPosIndex = k.randi(startingPos.length);
  const chosenFlyDirectionIndex = k.randi(flyDirections.length);

  return k.add([
    k.sprite("duck", { anim: "flight-side" }),
    k.area({ shape: new k.Rect(k.vec2(0), 24, 24) }),
    k.body(),
    k.anchor("center"),
    k.pos(startingPos[chosenPosIndex]),
    k.state("fly", ["fly", "shot", "fall"]),
    k.timer(),
    k.offscreen({ destroy: true, distance: 100 }),
    {
      flyTimer: 0,
      timeBeforeEscape: 5,
      duckId,
      flyDirection: null,
      speed,
      quackingSound: null,
      flappingSound: null,
      huntedBy: null,
      isAlive: true,
      hasBeenShot: false,
      setBehavior(this: GameObj) {
        this.flyDirection = flyDirections[chosenFlyDirectionIndex];
        if (this.flyDirection.x < 0) this.flipX = true;
        this.quackingSound = k.play("quacking", { volume: 0.5, loop: true });
        this.flappingSound = k.play("flapping", { loop: true, speed: 2 });

        this.onStateUpdate("fly", () => {
          const currentAnim =
            this.getCurAnim().name === "flight-side"
              ? "flight-diagonal"
              : "flight-side";

          if (
            (this.flyTimer < this.timeBeforeEscape &&
              this.pos.x > k.width() + 10) ||
            this.pos.x < -10
          ) {
            this.flyDirection.x = -this.flyDirection.x;
            this.flipX = !this.flipX;
            this.play(currentAnim);
          }

          if (this.pos.y < -10 || this.pos.y > k.height() - 70) {
            this.flyDirection.y = -this.flyDirection.y;
            this.play(currentAnim);
          }

          this.move(k.vec2(this.flyDirection).scale(this.speed));
        });

        this.onStateEnter("shot", async () => {
          gameManager.numberDucksShotInRound++;
          this.quackingSound.stop();
          this.flappingSound.stop();
          await k.wait(0.2);
          this.enterState("fall");
        });

        this.onStateEnter("fall", () => {
          this.fallSound = k.play("fall", { volume: 0.7 });
          this.play("fall");

          const worldPos = this.pos;
          const scoreText = k.add([
            k.text("+10", {
              font: "nes",
              size: 10,
            }),
            k.pos(worldPos.x, worldPos.y),
            k.anchor("center"),
            k.color(k.Color.fromHex(PLAYER_COLORS[this.huntedBy])),
            k.opacity(1),
            k.z(100),
          ]);

          k.wait(0.6, () => {
            k.destroy(scoreText);
          });
        });

        this.onStateUpdate("fall", async () => {
          this.move(0, this.speed);

          if (this.pos.y > k.height() - 70) {
            this.fallSound.stop();
            k.play("impact");
            const duckIcon = k.get(`duckIcon-${this.duckId}`, {
              recursive: true,
            })[0];

            if (duckIcon)
              duckIcon.color = k.Color.fromHex(PLAYER_COLORS[this.huntedBy]);

            gameManager.currentScore[this.huntedBy - 1] += 10;

            k.destroy(this);
            sky.color = k.Color.fromHex(COLORS.blue);

            await k.wait(1);
            gameManager.enterState("duck-hunted");
          }
        });

        const sky = k.get("sky")[0];
        this.loop(1, () => {
          this.flyTimer += 1;
          if (this.flyTimer === this.timeBeforeEscape) {
            sky.color = k.Color.fromHex(COLORS.beige);
          }
        });

        this.onUpdate(() => {
          if (this.isAlive) return;
          if (this.hasBeenShot) return;

          this.hasBeenShot = true;

          this.play("shot");
          this.enterState("shot");
        });

        this.onExitScreen(() => {
          this.quackingSound.stop();
          this.flappingSound.stop();
          sky.color = k.Color.fromHex(COLORS.blue);
          gameManager.enterState("duck-escaped");
        });
      },
    },
    "duck",
  ]);
}

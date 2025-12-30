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
      duckId,
      speed,
      flyTimer: 0,
      timeBeforeEscape: 5,
      flyDirection: null as any,
      quackingSound: null as any,
      flappingSound: null as any,
      fallSound: null as any,
      huntedBy: null as number | null,
      isAlive: true,
      hasBeenShot: false,

      setBehavior(this: GameObj) {
        const sky = k.get("sky")[0];

        this.flyDirection = flyDirections[chosenFlyDirectionIndex].clone();
        this.flipX = this.flyDirection.x < 0;

        this.quackingSound = k.play("quacking", { volume: 0.5, loop: true });
        this.flappingSound = k.play("flapping", { loop: true, speed: 2 });

        // 🕊️ FLY STATE
        this.onStateUpdate("fly", () => {
          const currentAnim =
            this.getCurAnim()?.name === "flight-side"
              ? "flight-diagonal"
              : "flight-side";

          const minX = -10;
          const maxX = k.width() + 10;
          const minY = -10;
          const maxY = k.height() - 70;

          if (
            (this.flyTimer < this.timeBeforeEscape && this.pos.x > maxX) ||
            this.pos.x < minX
          ) {
            this.flyDirection.x *= -1;
            this.flipX = this.flyDirection.x < 0;

            // 🔧 FIX do bug (isso NÃO existia antes)
            this.pos.x = k.clamp(this.pos.x, minX, maxX);

            this.play(currentAnim);
          }

          // Vertical sempre bate
          if (this.pos.y < minY || this.pos.y > maxY) {
            this.flyDirection.y *= -1;
            this.pos.y = k.clamp(this.pos.y, minY, maxY);
            this.play(currentAnim);
          }

          // Movimento frame-based (igual ao original)
          this.move(
            this.flyDirection.x * this.speed,
            this.flyDirection.y * this.speed,
          );
        });

        // 🔫 SHOT
        this.onStateEnter("shot", async () => {
          gameManager.numberDucksShotInRound++;
          this.quackingSound.stop();
          this.flappingSound.stop();
          await k.wait(0.2);
          this.enterState("fall");
        });

        // ⬇️ FALL
        this.onStateEnter("fall", () => {
          this.fallSound = k.play("fall", { volume: 0.7 });
          this.play("fall");

          const scoreText = k.add([
            k.text("+10", { font: "nes", size: 10 }),
            k.pos(this.pos.clone()),
            k.anchor("center"),
            k.color(k.Color.fromHex(PLAYER_COLORS[this.huntedBy!])),
            k.opacity(1),
            k.z(100),
          ]);

          k.wait(0.6, () => k.destroy(scoreText));
        });

        this.onStateUpdate("fall", async () => {
          this.move(0, this.speed);

          if (this.pos.y >= k.height() - 70) {
            this.fallSound.stop();
            k.play("impact");

            const duckIcon = k.get(`duckIcon-${this.duckId}`, {
              recursive: true,
            })[0];

            if (duckIcon) {
              duckIcon.color = k.Color.fromHex(PLAYER_COLORS[this.huntedBy!]);
            }

            gameManager.currentScore[this.huntedBy! - 1] += 10;

            k.destroy(this);
            sky.color = k.Color.fromHex(COLORS.blue);

            await k.wait(1);
            gameManager.enterState("duck-hunted");
          }
        });

        // ⏱️ TIMER (igual ao original)
        this.loop(1, () => {
          this.flyTimer += 1;
          if (this.flyTimer === this.timeBeforeEscape) {
            sky.color = k.Color.fromHex(COLORS.beige);
          }
        });

        // ☠️ HIT
        this.onUpdate(() => {
          if (this.isAlive) return;
          if (this.hasBeenShot) return;

          this.hasBeenShot = true;
          this.play("shot");
          this.enterState("shot");
        });

        // 🚪 ESCAPE
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

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  RotateCcw,
  X,
  Coins,
  Check,
  MousePointer2,
} from "lucide-react";
import { art, petArt, type Species } from "./art";
export type GameKind = "jump" | "bounce" | "catch" | "memory";
interface Props {
  kind: GameKind;
  species: Species;
  motion: boolean;
  onFinish: (score: number, coins: number) => void;
  onExit: () => void;
}
export default function Game(p: Props) {
  return p.kind === "memory" ? <Memory {...p} /> : <Arcade {...p} />;
}
function GameHeader({
  title,
  score,
  exit,
}: {
  title: string;
  score: string;
  exit: () => void;
}) {
  return (
    <header className="game-header">
      <button
        className="icon-button"
        onClick={exit}
        aria-label="Закончить игру"
      >
        <X size={20} />
      </button>
      <strong>{title}</strong>
      <span className="game-score">{score}</span>
    </header>
  );
}
function Result({
  score,
  coins,
  again,
  exit,
}: {
  score: number;
  coins: number;
  again: () => void;
  exit: () => void;
}) {
  return (
    <div className="game-result">
      <div className="result-spark">
        <Check size={32} />
      </div>
      <span className="eyebrow">Отлично поиграли</span>
      <h2>Вот это приключение!</h2>
      <p>{score} очков · радость питомца +15</p>
      <div className="reward-badge">
        <Coins size={24} />+{coins}
        <span>монет</span>
      </div>
      <button className="primary" onClick={again}>
        <RotateCcw size={18} />
        Ещё раз
      </button>
      <button className="text-button" onClick={exit}>
        Вернуться домой
      </button>
    </div>
  );
}
function Arcade(p: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    stateRef = useRef({ started: false, paused: false, over: false }),
    control = useRef({ left: false, right: false, target: -1 });
  const [run, setRun] = useState(0),
    [started, setStarted] = useState(false),
    [score, setScore] = useState(0),
    [result, setResult] = useState<{ score: number; coins: number } | null>(
      null,
    );
  const current = useRef(p);
  current.current = p;
  const complete = useRef(false),
    scoreRef = useRef(0),
    coinsRef = useRef(0),
    finishRef = useRef<() => void>(() => {});
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    el.width = 360;
    el.height = 560;
    const W = 360,
      H = 560;
    let raf = 0,
      prev = 0,
      time = 0,
      highest = 0,
      currentScore = 0,
      level = 1,
      lives = 3;
    stateRef.current = { started: false, paused: false, over: false };
    complete.current = false;
    scoreRef.current = 0;
    coinsRef.current = 0;
    control.current = { left: false, right: false, target: -1 };
    const char = petArt(p.species, "happy");
    let x = 180,
      y = 440,
      vy = -330,
      vx = 105,
      ballX = 180,
      ballY = 420;
    let platforms = Array.from({ length: 8 }, (_, i) => ({
      x: i === 0 ? 145 : 24 + ((i * 91) % 250),
      y: 500 - i * 75,
      w: 68,
    }));
    let bricks = makeBricks(1);
    let spawn = 0.3;
    let falling: {
      x: number;
      y: number;
      bad: boolean;
      kind: string;
      hit: boolean;
    }[] = [];
    const treats = ["apple", "pear", "strawberry", "orange", "peach", "cherry"];
    function makeBricks(l: number) {
      return Array.from(
        { length: Math.min(6, 3 + Math.floor(l / 2)) * 5 },
        (_, i) => ({
          x: 21 + (i % 5) * 65,
          y: 66 + Math.floor(i / 5) * 26,
          alive: true,
          color: ["#99ad8d", "#d7a388", "#b7b897", "#d5be8c"][(i + l) % 4],
        }),
      );
    }
    const finish = () => {
      if (complete.current) return;
      complete.current = true;
      stateRef.current.over = true;
      const s = scoreRef.current,
        c = coinsRef.current;
      setResult({ score: s, coins: c });
      if (started || stateRef.current.started) current.current.onFinish(s, c);
    };
    finishRef.current = finish;
    const key = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key === "a")
        control.current.left = e.type === "keydown";
      if (e.key === "ArrowRight" || e.key === "d")
        control.current.right = e.type === "keydown";
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    const visibility = () => {
      stateRef.current.paused = document.hidden;
      control.current = { left: false, right: false, target: -1 };
      prev = 0;
    };
    document.addEventListener("visibilitychange", visibility);
    const frame = (stamp: number) => {
      raf = requestAnimationFrame(frame);
      const dt = prev ? Math.min(0.03, (stamp - prev) / 1000) : 0.016;
      prev = stamp;
      const live =
        stateRef.current.started &&
        !stateRef.current.over &&
        !stateRef.current.paused;
      if (live) time += dt;
      ctx.fillStyle = p.kind === "jump" ? "#edf1df" : "#f3ebdc";
      ctx.fillRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      // Scenic parallax backdrop, rendered entirely offline.
      ctx.fillStyle = "#d9e2cb";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(55 + i * 110, 470 + (i % 2) * 32, 110, 0, 7);
        ctx.fill();
      }
      for (let i = 0; i < 7; i++) {
        const cx =
            (i * 83 + (p.motion ? Math.sin(time * 0.15 + i) * 8 : 0)) % 390,
          cy = 45 + ((i * 71) % 310);
        ctx.fillStyle = "#fff9e9";
        ctx.fillRect(cx, cy, 40, 9);
        ctx.fillRect(cx + 8, cy - 6, 22, 6);
      }
      if (p.kind === "jump") {
        if (live) {
          const c = control.current;
          if (c.target >= 0) x += (c.target - x) * Math.min(1, dt * 10);
          else x += (c.right ? 230 : 0) * dt - (c.left ? 230 : 0) * dt;
          x = Math.max(20, Math.min(340, x));
          vy += 680 * dt;
          const oldY = y;
          y += vy * dt;
          if (vy > 0)
            for (const plat of platforms) {
              if (
                oldY + 22 <= plat.y + 6 &&
                y + 22 >= plat.y &&
                x + 15 > plat.x &&
                x - 15 < plat.x + plat.w
              ) {
                vy = -360;
                break;
              }
            }
          if (y < 225) {
            const delta = 225 - y;
            y = 225;
            highest += delta;
            platforms.forEach((plat) => (plat.y += delta));
            currentScore = Math.floor(highest / 2);
            scoreRef.current = currentScore;
            coinsRef.current = Math.floor(currentScore / 100) * 10;
            setScore(currentScore);
          }
          for (const plat of platforms)
            if (plat.y > H + 15) {
              plat.y = Math.min(...platforms.map((p) => p.y)) - 65;
              plat.x = 20 + Math.random() * 265;
            }
          if (y > H + 40) finish();
        }
        for (const plat of platforms) {
          ctx.fillStyle = "#8a9b70";
          ctx.fillRect(plat.x, plat.y, plat.w, 9);
          ctx.fillStyle = "#c3cfa2";
          ctx.fillRect(plat.x + 3, plat.y - 3, plat.w - 6, 4);
          ctx.fillStyle = "#70835f";
          ctx.fillRect(plat.x + 6, plat.y + 9, plat.w - 12, 4);
        }
        ctx.drawImage(char, x - 27, y - 31, 54, 54);
      } else if (p.kind === "bounce") {
        if (live) {
          const c = control.current;
          if (c.target >= 0) x += (c.target - x) * Math.min(1, dt * 14);
          else x += (c.right ? 280 : 0) * dt - (c.left ? 280 : 0) * dt;
          x = Math.max(40, Math.min(320, x));
          ballX += vx * dt;
          ballY += vy * dt;
          if (ballX < 9) {
            ballX = 9;
            vx = Math.abs(vx);
          }
          if (ballX > 351) {
            ballX = 351;
            vx = -Math.abs(vx);
          }
          if (ballY < 15) {
            ballY = 15;
            vy = Math.abs(vy);
          }
          if (
            vy > 0 &&
            ballY > 477 &&
            ballY < 500 &&
            Math.abs(ballX - x) < 45
          ) {
            vy = -Math.abs(vy);
            vx = (ballX - x) * 6;
            ballY = 477;
          }
          for (const b of bricks)
            if (
              b.alive &&
              ballX > b.x - 6 &&
              ballX < b.x + 61 &&
              ballY > b.y - 7 &&
              ballY < b.y + 26
            ) {
              b.alive = false;
              vy = -vy;
              currentScore += 10;
              scoreRef.current = currentScore;
              setScore(currentScore);
              break;
            }
          if (ballY > H + 20) {
            lives--;
            if (lives <= 0) finish();
            else {
              ballX = x;
              ballY = 430;
              vy = -310;
              vx = 105;
            }
          }
          if (bricks.every((b) => !b.alive)) {
            coinsRef.current = level * 10;
            if (level >= 10) finish();
            else {
              level++;
              bricks = makeBricks(level);
              ballX = x;
              ballY = 420;
              vy = -310 - level * 8;
            }
          }
        }
        for (const b of bricks)
          if (b.alive) {
            ctx.fillStyle = "#967b5e";
            ctx.fillRect(b.x, b.y + 3, 56, 20);
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, 56, 19);
            ctx.fillStyle = "#ffffff55";
            ctx.fillRect(b.x + 3, b.y + 3, 50, 2);
          }
        ctx.fillStyle = "#687d5d";
        ctx.fillRect(x - 41, 490, 82, 10);
        ctx.fillStyle = "#a3b293";
        ctx.fillRect(x - 38, 487, 76, 4);
        ctx.drawImage(char, x - 23, 447, 46, 46);
        ctx.fillStyle = "#896244";
        ctx.beginPath();
        ctx.ellipse(ballX, ballY, 8, 7, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#b38c62";
        ctx.fillRect(ballX - 4, ballY - 6, 8, 3);
        ctx.fillStyle = "#665445";
        ctx.font = "13px sans-serif";
        ctx.fillText(`Уровень ${level}/10`, 20, 535);
        ctx.fillText(`Попытки: ${lives}`, 240, 535);
      } else {
        if (live) {
          const c = control.current;
          if (c.target >= 0) x += (c.target - x) * Math.min(1, dt * 12);
          else x += (c.right ? 250 : 0) * dt - (c.left ? 250 : 0) * dt;
          x = Math.max(28, Math.min(332, x));
          spawn -= dt;
          if (spawn <= 0) {
            spawn = 0.48 + Math.random() * 0.3;
            falling.push({
              x: 24 + Math.random() * 312,
              y: -24,
              bad: Math.random() < 0.2,
              kind: treats[Math.floor(Math.random() * treats.length)],
              hit: false,
            });
          }
          for (const item of falling) {
            item.y += 125 * dt;
            if (
              item.y > 470 &&
              item.y < 512 &&
              Math.abs(item.x - x) < 37 &&
              !item.hit
            ) {
              item.hit = true;
              if (item.bad) lives--;
              else {
                currentScore += 100;
                scoreRef.current = currentScore;
                coinsRef.current = Math.floor(currentScore / 100) * 10;
                setScore(currentScore);
              }
            }
          }
          falling = falling.filter((i) => !i.hit && i.y < 590);
          if (lives <= 0 || time >= 30) finish();
        }
        for (const item of falling) {
          if (item.bad) {
            ctx.fillStyle = "#82877a";
            ctx.beginPath();
            ctx.moveTo(item.x - 11, item.y);
            ctx.lineTo(item.x - 5, item.y - 9);
            ctx.lineTo(item.x + 6, item.y - 10);
            ctx.lineTo(item.x + 12, item.y + 3);
            ctx.lineTo(item.x + 5, item.y + 10);
            ctx.lineTo(item.x - 8, item.y + 8);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#a3aa96";
            ctx.fillRect(item.x - 4, item.y - 6, 7, 3);
          } else {
            const image = art(item.kind),
              scale = 34 / Math.max(image.width, image.height);
            ctx.drawImage(
              image,
              item.x - (image.width * scale) / 2,
              item.y - (image.height * scale) / 2,
              image.width * scale,
              image.height * scale,
            );
          }
        }
        ctx.drawImage(char, x - 31, 447, 62, 62);
        ctx.drawImage(art("basket"), x - 43, 491, 86, 43);
        ctx.fillStyle = "#778468";
        ctx.font = "13px sans-serif";
        ctx.fillText(
          "Ещё " + Math.max(0, Math.ceil(30 - time)) + " с",
          20,
          548,
        );
        ctx.fillText("Попытки: " + lives, 246, 548);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [run]);
  const exit = () => {
    if (stateRef.current.started && !complete.current) finishRef.current();
    p.onExit();
  };
  const again = () => {
    setResult(null);
    setScore(0);
    setStarted(false);
    setRun((v) => v + 1);
  };
  const begin = () => {
    stateRef.current.started = true;
    setStarted(true);
  };
  const target = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.started || result) return;
    const r = e.currentTarget.getBoundingClientRect();
    const scale = Math.min(r.width / 360, r.height / 560),
      offset = (r.width - 360 * scale) / 2;
    control.current.target = Math.max(
      20,
      Math.min(340, (e.clientX - r.left - offset) / scale),
    );
  };
  return (
    <div className="game-screen">
      <GameHeader
        title={
          p.kind === "jump"
            ? "Облачный прыжок"
            : p.kind === "catch"
              ? "Фруктовый дождь"
              : "Пиксельный отскок"
        }
        score={String(score)}
        exit={exit}
      />
      <div className="arcade-area">
        <canvas
          ref={canvas}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            target(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons) target(e);
          }}
          onPointerUp={() => {
            control.current.target = -1;
          }}
          onPointerCancel={() => {
            control.current.target = -1;
          }}
          aria-label="Игровое поле. Управляйте движением пальцем или стрелками клавиатуры"
        />
        {!started && !result && (
          <div className="game-start">
            <MousePointer2 size={30} />
            <h2>
              {p.kind === "jump"
                ? "Повыше к облакам"
                : p.kind === "catch"
                  ? "Лови маленькие радости"
                  : "Разобьём все блоки"}
            </h2>
            <p>
              Води пальцем по экрану
              <br />
              или используй стрелки
            </p>
            <span className="small-reward">
              {p.kind !== "bounce"
                ? "100 очков = 10 монет"
                : "10 уровней · 10 монет за каждый"}
            </span>
            <button className="primary" onClick={begin}>
              <Play size={18} />
              Поехали
            </button>
          </div>
        )}
        {result && <Result {...result} again={again} exit={p.onExit} />}
      </div>
      <div className="game-controls">
        <button
          aria-label="Двигаться влево"
          onPointerDown={() => {
            control.current.left = true;
          }}
          onPointerUp={() => {
            control.current.left = false;
          }}
          onPointerLeave={() => {
            control.current.left = false;
          }}
        >
          <ArrowLeft />
        </button>
        <span>Играй в своём ритме</span>
        <button
          aria-label="Двигаться вправо"
          onPointerDown={() => {
            control.current.right = true;
          }}
          onPointerUp={() => {
            control.current.right = false;
          }}
          onPointerLeave={() => {
            control.current.right = false;
          }}
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
function Memory(p: Props) {
  const kinds = ["strawberry", "pear", "banana", "cherry", "cookie", "milk"];
  const shuffle = () =>
    [...kinds, ...kinds]
      .map((kind, id) => ({ kind, id }))
      .sort(() => Math.random() - 0.5);
  const [cards, setCards] = useState(shuffle),
    [flipped, setFlipped] = useState<number[]>([]),
    [matched, setMatched] = useState<number[]>([]),
    [turns, setTurns] = useState(0),
    [result, setResult] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    flipsRef = useRef<number[]>([]),
    matchedRef = useRef<number[]>([]);
  const done = useRef(false);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  const flip = (i: number) => {
    if (
      flipsRef.current.length >= 2 ||
      flipsRef.current.includes(i) ||
      matchedRef.current.includes(i) ||
      result
    )
      return;
    const next = [...flipsRef.current, i];
    flipsRef.current = next;
    setFlipped(next);
    if (next.length === 2) {
      setTurns((v) => v + 1);
      const [a, b] = next;
      if (cards[a].kind === cards[b].kind) {
        const m = [...matchedRef.current, a, b];
        matchedRef.current = m;
        setMatched(m);
        timer.current = setTimeout(() => {
          flipsRef.current = [];
          setFlipped([]);
          if (m.length === 12 && !done.current) {
            done.current = true;
            p.onFinish(Math.max(10, 120 - (turns + 1) * 4), 30);
            setResult(true);
          }
        }, 400);
      } else
        timer.current = setTimeout(() => {
          flipsRef.current = [];
          setFlipped([]);
        }, 800);
    }
  };
  const again = () => {
    setCards(shuffle());
    setFlipped([]);
    setMatched([]);
    setTurns(0);
    setResult(false);
    flipsRef.current = [];
    matchedRef.current = [];
    done.current = false;
  };
  return (
    <div className="game-screen memory">
      <GameHeader
        title="Найди пару"
        score={`${matched.length / 2} / 6`}
        exit={p.onExit}
      />
      <div className="memory-intro">
        <span className="eyebrow">Тренируем память</span>
        <h2>Две половинки радости</h2>
        <p>Найди одинаковые лакомства</p>
      </div>
      <div className="memory-board">
        {cards.map((card, i) => {
          const open = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={card.id}
              className={`memory-card ${open ? "revealed" : ""} ${matched.includes(i) ? "matched" : ""}`}
              onClick={() => flip(i)}
              aria-label={`Карточка ${i + 1}${open ? `, ${card.kind}` : ""}`}
              disabled={matched.includes(i)}
            >
              {open ? (
                <img src={art(card.kind).toDataURL()} alt="Лакомство" />
              ) : (
                <span>✿</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="memory-footer">
        Ходов: {turns}
        <span>
          <Coins size={16} />
          Награда: 30 монет
        </span>
      </div>
      {result && (
        <Result
          score={Math.max(10, 120 - turns * 4)}
          coins={30}
          again={again}
          exit={p.onExit}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";

interface Props {
  phrases: string[];
  className?: string;
  typingMs?: number;
  pauseMs?: number;
}

export const Typewriter = ({ phrases, className, typingMs = 75, pauseMs = 1600 }: Props) => {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const phrase = phrases[i % phrases.length];
    if (!del && text === phrase) {
      const t = setTimeout(() => setDel(true), pauseMs);
      return () => clearTimeout(t);
    }
    if (del && text === "") {
      setDel(false);
      setI((v) => (v + 1) % phrases.length);
      return;
    }
    const t = setTimeout(() => {
      setText((cur) => del ? cur.slice(0, -1) : phrase.slice(0, cur.length + 1));
    }, del ? typingMs / 2 : typingMs);
    return () => clearTimeout(t);
  }, [text, del, i, phrases, typingMs, pauseMs]);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[3px] h-[0.9em] align-middle bg-accent ml-1 animate-pulse" />
    </span>
  );
};

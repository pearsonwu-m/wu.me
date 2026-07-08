function CharacterIcon({
  char,
  className,
}: {
  char: string;
  className?: string;
}) {
  return (
    <span
      className={`font-chinese flex items-center justify-center text-[42px] leading-none ${className ?? ""}`}
    >
      {char}
    </span>
  );
}

export function AtomIcon({ className }: { className?: string }) {
  return <CharacterIcon char="理" className={className} />;
}

export function ChipIcon({ className }: { className?: string }) {
  return <CharacterIcon char="科" className={className} />;
}

export function GlobeIcon({ className }: { className?: string }) {
  return <CharacterIcon char="社" className={className} />;
}

export function PersonIcon({ className }: { className?: string }) {
  return <CharacterIcon char="我" className={className} />;
}

export function MailIcon({ className }: { className?: string }) {
  return <CharacterIcon char="信" className={className} />;
}

export function BookIcon({ className }: { className?: string }) {
  return <CharacterIcon char="文" className={className} />;
}

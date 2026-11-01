type NumberGridValues = (number | null)[][];

function SingleNumberGrid({ numbers }: { numbers: NumberGridValues }) {
  const columnCount = numbers[0]?.length ?? 0;
  return (
    <span
      className="inline-grid gap-0.5 font-mono text-[11px] tabular-nums"
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(1.5rem, auto))` }}
    >
      {numbers.flatMap((row, rowIndex) =>
        row.map((value, columnIndex) => (
          <span
            key={`${rowIndex}-${columnIndex}`}
            className={value === null ? "" : "rounded bg-muted px-1 py-0.5 text-center"}
          >
            {value ?? ""}
          </span>
        )),
      )}
    </span>
  );
}

export function NumberGrid({ cards }: { cards: NumberGridValues[] }) {
  if (cards.length === 1) {
    return <SingleNumberGrid numbers={cards[0]} />;
  }
  return (
    <span className="flex flex-wrap gap-3">
      {cards.map((numbers, cardIndex) => (
        <span key={cardIndex} className="grid gap-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Matriz {cardIndex + 1}</span>
          <SingleNumberGrid numbers={numbers} />
        </span>
      ))}
    </span>
  );
}

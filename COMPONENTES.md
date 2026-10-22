# Especificación de componentes (React + Tailwind)

Tokens: `bg #fafafa` · `card #fff` · `ink #171717` · `line #ebebeb` · `ok #297a3a` · radio `6px`
Anillo: `shadow-[0_0_0_1px_rgba(0,0,0,.08),0_0_0_2px_#fafafa]`

```jsx
export const Card = ({ children }) => (
  <div className="rounded-md bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,.08),0_0_0_2px_#fafafa]">{children}</div>
);

export const Button = ({ ghost, ...p }) => (
  <button {...p} className={`rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${
    ghost ? 'border-[#ebebeb] bg-transparent text-[#171717]' : 'border-[#171717] bg-[#171717] text-white'}`} />
);

export const VerifiedBadge = () => (
  <span className="rounded-md border border-[#171717] px-1.5 font-mono text-[10px] uppercase tracking-[.071em]">VERIFICADO ▲</span>
);

export const CliLine = ({ ok, children }) => (
  <div className="font-mono text-xs">
    <span className={ok ? 'text-[#297a3a]' : 'text-[#171717]'}>{ok ? '✓' : '▲'} </span>{children}
  </div>
);

export const Square = ({ dark, piece, selected, hint, onClick, label }) => (
  <button aria-label={label} onClick={onClick}
    className={`relative flex aspect-square items-center justify-center text-4xl ${dark ? 'bg-[#d4d4d4]' : 'bg-[#f0f0f0]'} ${selected ? 'ring-[3px] ring-inset ring-[#171717]' : ''}`}>
    {piece}{hint && <i className="absolute h-1/5 w-1/5 rounded-full bg-black/40" />}
  </button>
);
```
Estado de la partida y XP: ver `schema.json`.

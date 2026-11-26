/**
 * Motivo gráfico "REDE = ESCALA": nós conectados que se adensam da esquerda para a direita.
 * Decorativo (aria-hidden). Posições determinísticas para não variar entre servidor e cliente.
 */
const NOS: [number, number, number][] = [
  [40, 210, 3], [95, 150, 3.5], [120, 250, 3], [170, 190, 4], [210, 110, 3],
  [240, 260, 3.5], [280, 170, 4.5], [320, 80, 3], [340, 230, 4], [380, 140, 5],
  [410, 290, 3], [440, 60, 3.5], [460, 200, 5], [500, 110, 4], [520, 260, 4],
  [550, 30, 3], [570, 170, 5.5], [600, 80, 4], [610, 240, 4.5], [640, 140, 5],
];

const ARESTAS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [3, 6], [4, 7], [5, 8], [6, 8], [6, 9], [7, 9],
  [8, 10], [8, 12], [9, 11], [9, 12], [9, 13], [11, 13], [12, 14], [12, 16], [13, 15], [13, 16],
  [13, 17], [14, 18], [16, 18], [16, 19], [17, 19], [15, 17], [10, 14], [18, 19],
];

export function Rede({ className = "", cor = "currentColor" }: { className?: string; cor?: string }) {
  return (
    <svg viewBox="0 0 680 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" className={className}>
      <g stroke={cor} strokeWidth="1.2" strokeOpacity="0.35">
        {ARESTAS.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NOS[a][0]} y1={NOS[a][1]} x2={NOS[b][0]} y2={NOS[b][1]} />
        ))}
      </g>
      <g fill={cor}>
        {NOS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fillOpacity={0.35 + (i / NOS.length) * 0.65} />
        ))}
      </g>
    </svg>
  );
}

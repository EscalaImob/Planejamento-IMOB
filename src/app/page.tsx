import { Planejador } from "@/components/Planejador";
import { capturaPublica } from "@/server/leads/config";

export default function Pagina() {
  // Só informa ao cliente se a captura está ativa e o link da política; nenhum segredo sai do servidor.
  return <Planejador captura={capturaPublica()} />;
}

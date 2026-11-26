// Cloudflare Pages "escala-planejamento": recebe o subdomínio próprio (planejamento.escalaimob.com.br,
// CNAME na Hostinger) e entrega cada requisição, sem alterações, ao Worker do site pelo service binding APP.
// Assim o domínio funciona sem mover o DNS do escalaimob.com.br para o Cloudflare.
const encaminhar = {
  fetch(request, env) {
    return env.APP.fetch(request);
  },
};

export default encaminhar;

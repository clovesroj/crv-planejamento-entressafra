/**
 * GERADO por scripts/gasto-reforma-bi.mjs em 2026-09-22T16:54:24.857Z.
 * Nao editar a mao -- rode o script de novo para atualizar. Ver o cabecalho
 * do script para os parametros usados nesta extracao.
 *
 * Gasto real (ERP, via Power BI) por codigo de Frota e por *COMPARTIMENTO*
 * encontrado na Descricao Produto. So leitura: a aba Reforma de Frota usa
 * isto como referencia ao lado do orcamento digitado, nunca substitui.
 *
 * porFrota[cod][compartimento] = { total, itens: [{desc, valor, data, empresa, reforma}, ...] }
 * -- reforma e "SIM" ou "NAO", vinda de uma 2ª passada de rolagem (ver
 * REFORMA SIM/NAO POR LANCAMENTO no topo do arquivo).
 * -- o total alimenta o "real: R$ X" ao lado do campo; os itens sao o que
 * aparece ao clicar nesse número (rastro "reformabi:<familia>|<cod>|<conjunto>",
 * ver calculo/rastro.js).
 */
export const GASTO_REFORMA_BI = {
  "geradoEm": "2026-09-22T16:54:24.857Z",
  "periodos": [
    {
      "inicio": "2026-01-01",
      "fim": "2026-01-07",
      "especialidade": "COLHEDORA - CANA"
    }
  ],
  "empresas": "todas",
  "truncado": false,
  "porFrota": {
    "12506": {
      "CORTADOR": {
        "total": 76.57,
        "itens": [
          {
            "desc": "KIT CILINDRO HIDRAULICO AHC13485 *CORTADOR*",
            "valor": 76.57,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      }
    },
    "12507": {
      "MOTOR": {
        "total": 484.14,
        "itens": [
          {
            "desc": "OLEO LUBR. MINERAL 15W40 API CI-4/SL *MOTOR*",
            "valor": 331.96,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FILTRO LUBR. P553161 DN / DZ101884 JD *MOTOR*",
            "valor": 152.18,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "12509": {
      "RODANTE": {
        "total": 6247.88,
        "itens": [
          {
            "desc": "SERV MANUT MOLA TENSORA *RODANTE*",
            "valor": 1305,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARO RODA MOTRIZ CB01418819 *RODANTE*",
            "valor": 1571.89,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA CB01490885 *RODANTE*",
            "valor": 84.37,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TIRANTE EIXO MOLA TENSORA CB01490886 *RODANTE*",
            "valor": 195.38,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VEDACAO CXT12412 *RODANTE*",
            "valor": 102.12,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL BUJAO ROLETE INFERIOR 1S8947 *RODANTE*",
            "valor": 2.66,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "BUJAO ROLETE INFERIOR 2P0347 *RODANTE*",
            "valor": 14.2,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "EIXO T139463 *RODANTE*",
            "valor": 858.65,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL EIXO ROLETE DUPLO MK 7F8267 *RODANTE*",
            "valor": 8.88,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL GAIOLA ROLETE DUPLO 1H8128 *RODANTE*",
            "valor": 12.43,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA BRONZE A01043A0N20 *RODANTE*",
            "valor": 195.38,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "DUO CONE ROLETE INFERIOR A01061A0N00 *RODANTE*",
            "valor": 213.14,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "MANCAL RODA GUIA CB014188022 *RODANTE*",
            "valor": 1598.53,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PINO CENTRAGEM CB01485604 AXT21736 *RODANTE*",
            "valor": 53.28,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA 3B4508 *RODANTE*",
            "valor": 31.97,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 53.28,
        "itens": [
          {
            "desc": "PARAFUSO SEXTAVADO 0S1585 *HIDRAULICA*",
            "valor": 53.28,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "ELETRICA": {
        "total": 1406.56,
        "itens": [
          {
            "desc": "BATERIA AUTO CCA 700 12V 100AH SELADA *ELETRICA*",
            "valor": 1357.98,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "BUZINA SUPERSOM 12V B64 BZM *ELETRICA*",
            "valor": 48.58,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      }
    },
    "12510": {
      "ELEVADOR": {
        "total": 4853.169999999999,
        "itens": [
          {
            "desc": "PINO CB01487621 *ELEVADOR*",
            "valor": 58.02,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA BT573A *ELEVADOR*",
            "valor": 140.2,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "KIT  DE ENGRENAGEM BLINDAGEM MC 6199 *ELEVADOR*",
            "valor": 3910.87,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA CXT17212 *ELEVADOR*",
            "valor": 61.16,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PECAS MONTAGEM AXT18056 CB11488003 *ELEVADOR*",
            "valor": 297.2,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "POLIA CENTRAL CB01437522 031448 *ELEVADOR*",
            "valor": 213.28,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "SUPORTE CB11462481 *ELEVADOR*",
            "valor": 172.44,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 1362.49,
        "itens": [
          {
            "desc": "ARTICULACAO AXT15503 AXT14238 *DIVISOR LINHA*",
            "valor": 602.28,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "SAPATA LE AXT16376 AXT11286 *DIVISOR LINHA*",
            "valor": 711.89,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA 0610005800 *DIVISOR LINHA*",
            "valor": 48.32,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CHASSI": {
        "total": 1199.46,
        "itens": [
          {
            "desc": "BUCHA 0110022801 *CHASSI*",
            "valor": 38.44,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "AMORTECEDOR BATENTE POLIURETANO 21020013 *CHASSI*",
            "valor": 1161.02,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 1033.94,
        "itens": [
          {
            "desc": "PINO CB01487612 *ROLO ALIMENTACAO*",
            "valor": 280.07,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PEDESTAL AXT13199 AXT18308 *ROLO ALIMENTACAO*",
            "valor": 753.87,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 57.29,
        "itens": [
          {
            "desc": "ISOLADOR 0290042754 *MOTOR*",
            "valor": 57.29,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CORTE BASE": {
        "total": 46.72,
        "itens": [
          {
            "desc": "TAMPAO CORTE BASE 0711349370 *CORTE BASE*",
            "valor": 46.72,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "EXT SECUNDARIO": {
        "total": 513.88,
        "itens": [
          {
            "desc": "SOLDA BRUTA AXT22473 *EXT SECUNDARIO*",
            "valor": 513.88,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "TRUCK": {
        "total": 203.93,
        "itens": [
          {
            "desc": "FLANGE EIXO TRUCK MC1265 0290294195 *TRUCK*",
            "valor": 203.93,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "PICADOR": {
        "total": 321.87,
        "itens": [
          {
            "desc": "ISOLADOR RE206594 AXT15953 *PICADOR*",
            "valor": 321.87,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "RODANTE": {
        "total": 141.09,
        "itens": [
          {
            "desc": "ALETA HASTE ROTULA *RODANTE* 3000215",
            "valor": 141.09,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      }
    },
    "12511": {
      "ELEVADOR": {
        "total": 5659.460000000001,
        "itens": [
          {
            "desc": "KIT PARAFUSO COMPLETO MC5000 *ELEVADOR*",
            "valor": 1694.88,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CORRENTE ROLO CB01433201 CT-2 TC255 *ELEVADOR*",
            "valor": 3885.32,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "KIT REPARO CILINDRO *ELEVADOR* AHC16954 (B)",
            "valor": 79.26,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CORTE BASE": {
        "total": 24.85,
        "itens": [
          {
            "desc": "ANEL VEDACAO CB01477814 *CORTE BASE*",
            "valor": 24.85,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 1345.14,
        "itens": [
          {
            "desc": "MANCAL UNIVERSAL 004580 00041163 *DIVISOR LINHA*",
            "valor": 1036.13,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "KIT CILINDRO HIDRAULICO AH212096 *DIVISOR LINHA*",
            "valor": 99.71,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CILINDRO HIDRAULICO AHC20488 *DIVISOR LINHA*",
            "valor": 147.76,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "KIT RETENTOR CB11475501 *DIVISOR LINHA*",
            "valor": 61.54,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 752.6499999999999,
        "itens": [
          {
            "desc": "MANGUEIRA DZ105946 *HIDRAULICA*",
            "valor": 240.76,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA R528286 R519344 *HIDRAULICA*",
            "valor": 116.91,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA RE538291 RE525509 *HIDRAULICA*",
            "valor": 357.18,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ADAPTADOR 38H5002 *HIDRAULICA*",
            "valor": 37.8,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "MOTOR": {
        "total": 44832.93,
        "itens": [
          {
            "desc": "ABRACADEIRA RE528750 RE527990 *MOTOR*",
            "valor": 17.28,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARTICULACAO RE535990 *MOTOR*",
            "valor": 3657.61,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO ANGULO RE529871 RE527976 *MOTOR*",
            "valor": 41.58,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CORREIA R520755 *MOTOR*",
            "valor": 410.42,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "JUNTA R518263 R527884 DZ128866 *MOTOR*",
            "valor": 252.12,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO R520410 *MOTOR*",
            "valor": 33.58,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "SENSOR TEMPERATURA RE540860 *MOTOR*",
            "valor": 676.43,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TUBULACAO RE526292 *MOTOR*",
            "valor": 590.06,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VEDACAO RE535549 DZ123164 *MOTOR*",
            "valor": 249.89,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO 19M8832 *MOTOR*",
            "valor": 21.18,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VALVULA DRENO RE509097 *MOTOR*",
            "valor": 675.12,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO SEXTAVADO R520121 R528364 *MOTOR*",
            "valor": 77.37,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL ORING R504810 *MOTOR*",
            "valor": 36.73,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSOS SEXTAVADO R519439 *MOTOR*",
            "valor": 69.65,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO SEXTAVADO 19M7935 *MOTOR*",
            "valor": 29.58,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO R521323 *MOTOR*",
            "valor": 163.11,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ROLO CAME DZ116648 RE535576 RE555307 *MOTOR*",
            "valor": 4302.6,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO DZ110495 *MOTOR*",
            "valor": 1147.27,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO R128893 *MOTOR*",
            "valor": 18.98,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PLUG R121929 *MOTOR*",
            "valor": 40.46,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PLUGUE R82007 *MOTOR*",
            "valor": 36.3,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA R91360 *MOTOR*",
            "valor": 15.24,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TUBO OLEO R518376 *MOTOR*",
            "valor": 286.26,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TUBO RETORNO RE520032 *MOTOR*",
            "valor": 73.19,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TUBULACAO OLEO DZ104881 *MOTOR*",
            "valor": 479.9,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VEDACAO R521548 *MOTOR*",
            "valor": 16.53,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VEDACAO RE535552 DZ121137 *MOTOR*",
            "valor": 599.32,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO 19M7979 *MOTOR*",
            "valor": 12.28,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TERMOSTATO AR48675 *MOTOR*",
            "valor": 305.39,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "LUVA R522574 *MOTOR*",
            "valor": 144.84,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TAMPAO RE71255 *MOTOR*",
            "valor": 51.44,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "KIT ANEL O RE541037 *MOTOR*",
            "valor": 1153.11,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA R518871 *MOTOR*",
            "valor": 196.77,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "GUIA R526781 DZ123481 *MOTOR*",
            "valor": 520.75,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VARETA R536992 *MOTOR*",
            "valor": 902.28,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ADAPTADOR DZ112286 *MOTOR*",
            "valor": 113.47,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ADAPTADOR R543345 DZ113142 *MOTOR*",
            "valor": 298.98,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "AMORTECEDOR TORCAO RE538143 *MOTOR*",
            "valor": 4831.48,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "APOIO DZ105940 *MOTOR*",
            "valor": 77.32,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "APOIO R535980 *MOTOR*",
            "valor": 2675.82,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "APOIO RE553234 *MOTOR*",
            "valor": 323.35,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CAPA DZ112723 DZ123209 *MOTOR*",
            "valor": 2468.09,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CARCACA R520912 *MOTOR*",
            "valor": 2023.21,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "COLETOR AGUA RE526285 *MOTOR*",
            "valor": 1454.89,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "JUNTA MOTOR DZ115341 *MOTOR*",
            "valor": 7855.7,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "JUNTA R520645 *MOTOR*",
            "valor": 51.13,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TUBO VARETA DZ113053 *MOTOR*",
            "valor": 199.12,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ABRACADEIRA R524453 *MOTOR*",
            "valor": 264.9,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA 12M1646 *MOTOR*",
            "valor": 8.75,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ESPACADOR 28H3436 *MOTOR*",
            "valor": 53.84,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PINO CENTRAGEM R42340 *MOTOR*",
            "valor": 51.8,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA E63524 *MOTOR*",
            "valor": 5.4,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "LIMITADOR RE515636 *MOTOR*",
            "valor": 3764.26,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ORIFICIO RE522991 *MOTOR*",
            "valor": 881.3,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO R536840 *MOTOR*",
            "valor": 125.5,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "TREM FORCA": {
        "total": 93.44,
        "itens": [
          {
            "desc": "TAMPAO DRENO R107768 *TREM FORCA*",
            "valor": 41.83,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO 19M7753 *TREM FORCA*",
            "valor": 51.61,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "SIST COMB": {
        "total": 261.22,
        "itens": [
          {
            "desc": "LINHA COMBUSTIVEL RE525514 DZ118312 *SIST COMB*",
            "valor": 261.22,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "TRANSMISSAO": {
        "total": 1.59,
        "itens": [
          {
            "desc": "ANEL 51M7044 *TRANSMISSAO*",
            "valor": 1.59,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "ELETRICA": {
        "total": 250.84,
        "itens": [
          {
            "desc": "SENSOR TEMPERATURA DZ123024 RE537637 *ELETRICA*",
            "valor": 250.84,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CHASSI": {
        "total": 1712.28,
        "itens": [
          {
            "desc": "PLACA CXT20594 045821 *CHASSI*",
            "valor": 551.26,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "AMORTECEDOR BATENTE POLIURETANO 21020013 *CHASSI*",
            "valor": 1161.02,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "TRUCK": {
        "total": 5084.98,
        "itens": [
          {
            "desc": "MANCAL FIXACAO ACO 1045 C.JD 095 *TRUCK*",
            "valor": 5084.98,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "CORTADOR": {
        "total": 203.27999999999997,
        "itens": [
          {
            "desc": "KIT CILINDRO HIDRAULICO AHC13485 *CORTADOR*",
            "valor": 76.57,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "KIT CILINDRO HIDRAULICO AH168718 *CORTADOR*",
            "valor": 126.71,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      }
    },
    "12512": {
      "RODANTE": {
        "total": 26345.36,
        "itens": [
          {
            "desc": "SERV MANUT ENGRENAGEM MOTRIZ *RODANTE*",
            "valor": 900,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "SERV MANUT MOLA TENSORA *RODANTE*",
            "valor": 2610,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "SERV MANUT ESTEIRA *RODANTE*",
            "valor": 2100,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARO RODA MOTRIZ CB01418819 *RODANTE*",
            "valor": 1571.89,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA CB01490885 *RODANTE*",
            "valor": 168.73,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VEDACAO CXT12412 *RODANTE*",
            "valor": 204.26,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ELO MAO AMIGO L G14040L0N50/G *RODANTE*",
            "valor": 2220.18,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ELO MAO AMIGO L G14040L0N60 *RODANTE*",
            "valor": 2220.18,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "GRUPO PINO COM BUCHA D1404AF0N00048T *RODANTE*",
            "valor": 8761.72,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO CXT20658 *RODANTE*",
            "valor": 35.53,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO CXT20659 *RODANTE*",
            "valor": 35.53,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO SEXTAVADO ESTEIRA T126081 *RODANTE*",
            "valor": 1705.11,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA CB01419006 T45097 *RODANTE*",
            "valor": 682.02,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL BUJAO ROLETE INFERIOR 1S8947 *RODANTE*",
            "valor": 2.66,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "BUJAO ROLETE INFERIOR 2P0347 *RODANTE*",
            "valor": 14.2,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "EIXO T139463 *RODANTE*",
            "valor": 858.65,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL EIXO ROLETE DUPLO MK 7F8267 *RODANTE*",
            "valor": 8.88,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL GAIOLA ROLETE DUPLO 1H8128 *RODANTE*",
            "valor": 12.43,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA BRONZE A01043A0N20 *RODANTE*",
            "valor": 195.38,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "DUO CONE ROLETE INFERIOR A01061A0N00 *RODANTE*",
            "valor": 213.14,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "MANCAL RODA GUIA CB014188022 *RODANTE*",
            "valor": 1598.53,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PINO CENTRAGEM CB01485604 AXT21736 *RODANTE*",
            "valor": 53.28,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA 3B4508 *RODANTE*",
            "valor": 31.97,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ALETA HASTE ROTULA *RODANTE* 3000215",
            "valor": 141.09,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 53.28,
        "itens": [
          {
            "desc": "PARAFUSO SEXTAVADO 0S1585 *HIDRAULICA*",
            "valor": 53.28,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CORTE BASE": {
        "total": 4011.46,
        "itens": [
          {
            "desc": "PLACA DESGASTE BIPARTIDO 8963 *CORTE BASE*",
            "valor": 4011.46,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 147.76,
        "itens": [
          {
            "desc": "CILINDRO HIDRAULICO AHC20488 *DIVISOR LINHA*",
            "valor": 147.76,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CORTADOR": {
        "total": 76.57,
        "itens": [
          {
            "desc": "KIT CILINDRO HIDRAULICO AHC13485 *CORTADOR*",
            "valor": 76.57,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      }
    },
    "12513": {
      "RODANTE": {
        "total": 835.28,
        "itens": [
          {
            "desc": "ANEL ORING ESTEIRA *RODANTE* 026391 CE21705 (B)",
            "valor": 46.17,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL ORING ESTEIRA *RODANTE* 026393 CE21707 (B)",
            "valor": 77.74,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "DISCO FREIO ESTEIRA *RODANTE* 055589 DE20632 (B)",
            "valor": 323.32,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "DISCO EMBREAGEM *RODANTE* 055292 CE20586",
            "valor": 388.05,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "TRANSMISSAO": {
        "total": 282.08,
        "itens": [
          {
            "desc": "EIXO CAIXA 4 FUROS YZ102010 *TRANSMISSAO*",
            "valor": 282.08,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CORTE BASE": {
        "total": 297.64,
        "itens": [
          {
            "desc": "ROLAMENTO  JD9051/JD9116/759/752 *CORTE BASE*",
            "valor": 264.34,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL VEDACAO CB01477814 *CORTE BASE*",
            "valor": 24.85,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA 14H1058 *CORTE BASE*",
            "valor": 8.45,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 1036.13,
        "itens": [
          {
            "desc": "MANCAL UNIVERSAL 004580 00041163 *DIVISOR LINHA*",
            "valor": 1036.13,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "TRUCK": {
        "total": 16898.68,
        "itens": [
          {
            "desc": "EIXO CB01487118 *TRUCK*",
            "valor": 8449.34,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "EIXO CB01487118 *TRUCK*",
            "valor": 8449.34,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "ELEVADOR": {
        "total": 1916.9,
        "itens": [
          {
            "desc": "VALVULA SOLENOIDE CB01473982 *ELEVADOR*",
            "valor": 1323.66,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ESTICADOR ROSCA QUADRADA 00044916 *ELEVADOR*",
            "valor": 593.24,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CHASSI": {
        "total": 1161.02,
        "itens": [
          {
            "desc": "AMORTECEDOR BATENTE POLIURETANO 21020013 *CHASSI*",
            "valor": 1161.02,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      }
    },
    "12515": {
      "ROLO PRE TOMBADOR": {
        "total": 80.73,
        "itens": [
          {
            "desc": "KIT CILINDRO AH212090 *ROLO PRE TOMBADOR*",
            "valor": 80.73,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      }
    },
    "12519": {
      "DIVISOR LINHA": {
        "total": 1366.97,
        "itens": [
          {
            "desc": "BLINDAGEM CXT14608 *DIVISOR LINHA*",
            "valor": 14.83,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARTICULACAO AXT21029 *DIVISOR LINHA*",
            "valor": 602.28,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "SAPATA LD AXT16377 AXT11287 *DIVISOR LINHA*",
            "valor": 711.89,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA CXT16008 *DIVISOR LINHA*",
            "valor": 37.97,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CORTE BASE": {
        "total": 1752.23,
        "itens": [
          {
            "desc": "ANEL VEDACAO CB01477814 *CORTE BASE*",
            "valor": 24.85,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PINHAO CB01418408 *CORTE BASE*",
            "valor": 618.54,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "TAMPAO CORTE BASE 0711349370 *CORTE BASE*",
            "valor": 46.72,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ROLAMENTO  JD9051/JD9116/759/752 *CORTE BASE*",
            "valor": 1062.12,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "CHASSI": {
        "total": 1766,
        "itens": [
          {
            "desc": "BUCHA CHASSI DIVISOR CXT20552 *CHASSI*",
            "valor": 53.72,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PLACA CXT20594 045821 *CHASSI*",
            "valor": 551.26,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "AMORTECEDOR BATENTE POLIURETANO 21020013 *CHASSI*",
            "valor": 1161.02,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "RODANTE": {
        "total": 378.40999999999997,
        "itens": [
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 118.66,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 118.66,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ALETA HASTE ROTULA *RODANTE* 3000215",
            "valor": 141.09,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "ELEVADOR": {
        "total": 6543.7300000000005,
        "itens": [
          {
            "desc": "PARAFUSO 19M8727 *ELEVADOR*",
            "valor": 110.73,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA SEGURANCA 14M7560 *ELEVADOR*",
            "valor": 32.38,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "KIT PARAFUSO COMPLETO MC5000 *ELEVADOR*",
            "valor": 1694.88,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "REFORCO CB01440601 *ELEVADOR*",
            "valor": 17.18,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CORRENTE ROLO CB01433201 CT-2 TC255 *ELEVADOR*",
            "valor": 3885.32,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA CXT17212 *ELEVADOR*",
            "valor": 61.16,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ELO CORRENTE SW2060COUS *ELEVADOR*",
            "valor": 12.37,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CABO SEGURANCA CB01471989 CXT32793 *ELEVADOR*",
            "valor": 130.71,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "SUPORTE CB11462481 *ELEVADOR*",
            "valor": 172.44,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "POLIA CENTRAL CB01437522 031448 *ELEVADOR*",
            "valor": 426.56,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 419.37,
        "itens": [
          {
            "desc": "MANGUEIRA TUBO INTERCOOLER R500495 *HIDRAULICA*",
            "valor": 419.37,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "PICADOR": {
        "total": 2127.86,
        "itens": [
          {
            "desc": "KIT ROLAMENTO KXT10053 056779 *PICADOR*",
            "valor": 1805.99,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ISOLADOR RE206594 AXT15953 *PICADOR*",
            "valor": 321.87,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 57.29,
        "itens": [
          {
            "desc": "ISOLADOR 0290042754 *MOTOR*",
            "valor": 57.29,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 1384.9099999999999,
        "itens": [
          {
            "desc": "PEDESTAL AXT13199 AXT18308 *ROLO ALIMENTACAO*",
            "valor": 753.87,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "ROLETE AXT15586 *ROLO ALIMENTACAO*",
            "valor": 631.04,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 1598.28,
        "itens": [
          {
            "desc": "PLACA DESGASTE 0291370448 *EXT PRIMARIO*",
            "valor": 1598.28,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO PRE TOMBADOR": {
        "total": 216.31,
        "itens": [
          {
            "desc": "PALHETA CXT12995 *ROLO PRE TOMBADOR*",
            "valor": 216.31,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      }
    },
    "12520": {
      "MOTOR": {
        "total": 22387.58,
        "itens": [
          {
            "desc": "BUCHA R527877 *MOTOR*",
            "valor": 343.35,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CALCO R536310 *MOTOR*",
            "valor": 485.16,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "KIT PISTAO CAMISA DZ10211 DZ124284 *MOTOR*",
            "valor": 11926.36,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "LUVA RE543935 *MOTOR*",
            "valor": 491.99,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PINO PISTAO DZ113594 R517073 DZ101959 *MOTOR*",
            "valor": 2035.35,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO BIELA DZ120913 R542878 DZ124016 *MOTOR*",
            "valor": 601.89,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VALVULA ADMISSAO R520223 *MOTOR*",
            "valor": 745.87,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VALVULA ESCAPE R520224 *MOTOR*",
            "valor": 1445.67,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PLUGUE 30M7031 *MOTOR*",
            "valor": 201.49,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "GUIA VALVULA DZ111535 R527286 *MOTOR*",
            "valor": 1501.51,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "INSERTO ASSENTO VALVULA R527285 *MOTOR*",
            "valor": 1429.58,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "MOLA R504235 *MOTOR*",
            "valor": 664.94,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "RETENTOR R518233 *MOTOR*",
            "valor": 187.83,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VEDACAO RE529187 *MOTOR*",
            "valor": 326.59,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      }
    },
    "12523": {
      "RODANTE": {
        "total": 3070.49,
        "itens": [
          {
            "desc": "SERV MANUT MOLA TENSORA *RODANTE*",
            "valor": 1305,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA CB01490885 *RODANTE*",
            "valor": 87.03,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "VEDACAO CXT12412 *RODANTE*",
            "valor": 106.57,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARO RODA MOTRIZ CB01418819 *RODANTE*",
            "valor": 1571.89,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 3420,
        "itens": [
          {
            "desc": "SERV MANUT ESTRUTURA *DIVISOR LINHA*",
            "valor": 3420,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CORTE BASE": {
        "total": 4011.46,
        "itens": [
          {
            "desc": "PLACA DESGASTE BIPARTIDO 8963 *CORTE BASE*",
            "valor": 4011.46,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      }
    },
    "22504": {
      "SIST COMB": {
        "total": -650.66,
        "itens": [
          {
            "desc": "FILTRO COMB. AT387542 JD / S/C *SIST COMB*",
            "valor": -650.66,
            "data": "2026-01-01",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          }
        ]
      }
    },
    "22506": {
      "RODANTE": {
        "total": 141.09,
        "itens": [
          {
            "desc": "ALETA HASTE ROTULA *RODANTE* 3000215",
            "valor": 141.09,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22510": {
      "RODANTE": {
        "total": 2850.3600000000006,
        "itens": [
          {
            "desc": "SERV MANUT ESTRUTURA *RODANTE*",
            "valor": 2657.88,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA CB01490885 *RODANTE*",
            "valor": 79.01,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 71.87,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO CXT20658 *RODANTE*",
            "valor": 20.8,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO CXT35314 *RODANTE*",
            "valor": 20.8,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MEC DEDICADO": {
        "total": 1342.1,
        "itens": [
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 1342.1,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      }
    },
    "22518": {
      "SIST COMB": {
        "total": 492.55000000000007,
        "itens": [
          {
            "desc": "FILTRO COMB. AT387542 JD / S/C *SIST COMB*",
            "valor": -650.66,
            "data": "2026-01-01",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "CANO DESCARGA AXT11023 *SIST COMB*",
            "valor": 250.99,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CANO DESCARGA CXT15895 *SIST COMB*",
            "valor": 124.5,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SILENCIOSO CXT15211 *SIST COMB*",
            "valor": 767.72,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ELEVADOR": {
        "total": 3569.5399999999995,
        "itens": [
          {
            "desc": "HASTE CILINDRO GIRO 3011560 H211932 *ELEVADOR*",
            "valor": 1028.58,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "KIT REPARO CILINDRO *ELEVADOR* AH212101 (B)",
            "valor": 290.9,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "FLANGE LISA ELEVACAO 17 C.JD 085 *ELEVADOR*",
            "valor": 421.31,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "KIT MANCAL FIXACAO L/D L/E C.JD 123 *ELEVADOR*",
            "valor": 562.71,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA CXT17212 *ELEVADOR*",
            "valor": 36.62,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "PINO AXT10691 AXT20450 *ELEVADOR*",
            "valor": 58.47,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "PINO AXT10692 *ELEVADOR*",
            "valor": 73.13,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA 0110005999 *ELEVADOR*",
            "valor": 9.71,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA BT573A *ELEVADOR*",
            "valor": 29.28,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "PINO GIRO CXT29010 CB01487615 *ELEVADOR*",
            "valor": 454.67,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "CALCO CXT19061 *ELEVADOR*",
            "valor": 27.24,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL DA PONTA DO PIRULITO C.JD 001 *ELEVADOR*",
            "valor": 239.58,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT10691 AXT20450 *ELEVADOR*",
            "valor": 58.47,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487621 *ELEVADOR*",
            "valor": 65.21,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487625 *ELEVADOR*",
            "valor": 102.42,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT11485 L220860 *ELEVADOR*",
            "valor": 111.24,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "RODANTE": {
        "total": 440.46000000000004,
        "itens": [
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 62.86,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT16909 *RODANTE*",
            "valor": 377.6,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 1785.03,
        "itens": [
          {
            "desc": "ISOLADOR 0290042754 *MOTOR*",
            "valor": 61.23,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARACHOQUE 0151333927 *MOTOR*",
            "valor": 103.51,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "FLANGE MOTOR DO CORTE BASE C.JD 010 *MOTOR*",
            "valor": 194.78,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO SEXTAVADO 19H2716 *MOTOR*",
            "valor": 6.9,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO SEXTAVADO 19H2716 *MOTOR*",
            "valor": 55.2,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "INDICADOR DE NIVEL 0080284428 *MOTOR*",
            "valor": 26.41,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SUSPIRO YZ106688 *MOTOR*",
            "valor": 30,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO N14822 *MOTOR*",
            "valor": 307,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ENGRENAGEM YZ590113 4059007 *MOTOR*",
            "valor": 1000,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CHASSI": {
        "total": 3320.6499999999996,
        "itens": [
          {
            "desc": "CANTONEIRA CB01422171 *CHASSI*",
            "valor": 341.65,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PERFIL 0293001439 *CHASSI*",
            "valor": 883.3,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "VENEZIANA CB01460482 *CHASSI*",
            "valor": 446.5,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "AMORTECEDOR BATENTE POLIURETANO 21020013 *CHASSI*",
            "valor": 1649.2,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 436.82000000000005,
        "itens": [
          {
            "desc": "ANEL DO ROLO MAIOR C.JD 043 *EXT PRIMARIO*",
            "valor": 242.33,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL ROLO MENOR C.JD 042 *EXT PRIMARIO*",
            "valor": 194.49,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "PNEU": {
        "total": 86.16,
        "itens": [
          {
            "desc": "ARRUELA T151797 *PNEU*",
            "valor": 46.57,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA T151797 *PNEU*",
            "valor": 39.59,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CORTADOR": {
        "total": 1884.54,
        "itens": [
          {
            "desc": "CONEXAO ANGULO AT35123 *CORTADOR*",
            "valor": 109.53,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "TAMBOR CB11473031 *CORTADOR*",
            "valor": 858.03,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "TAMBOR CB11473032 *CORTADOR*",
            "valor": 916.98,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ELETRICA": {
        "total": 868.13,
        "itens": [
          {
            "desc": "CHICOTE AXT11588 *ELETRICA*",
            "valor": 504.22,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FUSIVEL LAMINA MINI 05AMP 1705 *ELETRICA*",
            "valor": 2.75,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FUSIVEL LAMINA MINI 10AMP 1710 *ELETRICA*",
            "valor": 2.83,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FUSIVEL LAMINA MINI 15AMP 1715 *ELETRICA*",
            "valor": 2.69,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FUSIVEL LAMINA MINI 20AMP 1720 *ELETRICA*",
            "valor": 2.68,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FUSIVEL LAMINA MINI 30AMP 1730 *ELETRICA*",
            "valor": 2.61,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO 19M7810 *ELETRICA*",
            "valor": 335.92,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON 39CM 400 X 4.8 *ELETRICA*",
            "valor": 7.5,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON PRETA 280MM X 4.8MM  *ELETRICA*",
            "valor": 6.93,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ADMISSAO": {
        "total": 2062.97,
        "itens": [
          {
            "desc": "PRE-FILTRO AXT21008 *ADMISSAO*",
            "valor": 2062.97,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 355.78,
        "itens": [
          {
            "desc": "ARRUELA 24H1245 *DIVISOR LINHA*",
            "valor": 5.01,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO DIVISOR LINHA AXT13650 *DIVISOR LINHA*",
            "valor": 328.37,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO ANGULO AE24616 *DIVISOR LINHA*",
            "valor": 22.4,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "PICADOR": {
        "total": 1035.92,
        "itens": [
          {
            "desc": "ROLAMENTO DC221239 *PICADOR*",
            "valor": 471,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO CE35057 *PICADOR*",
            "valor": 520.08,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO 19M7488 *PICADOR*",
            "valor": 44.84,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 788.61,
        "itens": [
          {
            "desc": "MANGUEIRA GH493-16 *HIDRAULICA*",
            "valor": 134.41,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH493-16 *HIDRAULICA*",
            "valor": 141.94,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA6FJ4 *HIDRAULICA*",
            "valor": 26.6,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1BA16FJA16 1EA16FJA16 *HIDRAULICA*",
            "valor": 291.4,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA6FJB4 *HIDRAULICA*",
            "valor": 55.68,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETA 1.5/16POL-12 1BA16FJ16 *HIDRAULICA*",
            "valor": 138.58,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "TREM FORCA": {
        "total": 786.31,
        "itens": [
          {
            "desc": "CONEXAO MANGUEIRA XPD36BTX *TREM FORCA*",
            "valor": 786.31,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CORTE BASE": {
        "total": 1177.9,
        "itens": [
          {
            "desc": "PINHAO CB01437885 *CORTE BASE*",
            "valor": 332.75,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ADAPTADOR CB01478047 *CORTE BASE*",
            "valor": 326.59,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL VEDACAO CB01477814 *CORTE BASE*",
            "valor": 26.38,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "APOIO CB11420671 *CORTE BASE*",
            "valor": 82.67,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT16118 *CORTE BASE*",
            "valor": 231.98,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CB01477813 *CORTE BASE*",
            "valor": 99.89,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO 19H2728 *CORTE BASE*",
            "valor": 77.64,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22519": {
      "RODANTE": {
        "total": 2746.9000000000005,
        "itens": [
          {
            "desc": "SERV MANUT MOLA TENSORA *RODANTE*",
            "valor": 2368.57,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PORCA CB01490885 *RODANTE*",
            "valor": 174.07,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CXT12412 *RODANTE*",
            "valor": 204.26,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22520": {
      "ELEVADOR": {
        "total": 1966.25,
        "itens": [
          {
            "desc": "KIT REPARO CILINDRO *ELEVADOR* AH212101 (B)",
            "valor": 290.9,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "FLANGE LISA ELEVACAO 17 C.JD 085 *ELEVADOR*",
            "valor": 421.31,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "KIT MANCAL FIXACAO L/D L/E C.JD 123 *ELEVADOR*",
            "valor": 562.71,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL DA PONTA DO PIRULITO C.JD 001 *ELEVADOR*",
            "valor": 239.58,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO RIGIDO ESFERA Y209 C3 *ELEVADOR*",
            "valor": 284.12,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487621 *ELEVADOR*",
            "valor": 65.21,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487625 *ELEVADOR*",
            "valor": 102.42,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 451.8,
        "itens": [
          {
            "desc": "JUNTA 0331380298 *EXT PRIMARIO*",
            "valor": 14.98,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL DO ROLO MAIOR C.JD 043 *EXT PRIMARIO*",
            "valor": 242.33,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL ROLO MENOR C.JD 042 *EXT PRIMARIO*",
            "valor": 194.49,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "PICADOR": {
        "total": 574.25,
        "itens": [
          {
            "desc": "KIT RETENTOR CXT26825 AE70192 *PICADOR*",
            "valor": 82.2,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "EIXO ACIONAMENTO AZ56818 *PICADOR*",
            "valor": 447.21,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO 19M7488 *PICADOR*",
            "valor": 44.84,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "RODANTE": {
        "total": 62.86,
        "itens": [
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 62.86,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 1101.8600000000001,
        "itens": [
          {
            "desc": "VEDACAO YZ100016 YZ590140 *MOTOR*",
            "valor": 23.07,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ISOLADOR 0290042754 *MOTOR*",
            "valor": 61.23,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "LUVA ESTRIADA 4028056 *MOTOR*",
            "valor": 231.2,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL C11884 *MOTOR*",
            "valor": 6.39,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL VEDACAO N153493 *MOTOR*",
            "valor": 34.81,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO F1122824 *MOTOR*",
            "valor": 33.84,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "PARACHOQUE 0151333927 *MOTOR*",
            "valor": 103.51,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL F37030275 *MOTOR*",
            "valor": 37.2,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FLANGE MOTOR DO CORTE BASE C.JD 010 *MOTOR*",
            "valor": 194.78,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO N14822 *MOTOR*",
            "valor": 307,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "INDICADOR DE NIVEL 0080284428 *MOTOR*",
            "valor": 26.41,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SUSPIRO YZ106688 *MOTOR*",
            "valor": 30,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA 0050021074 *MOTOR*",
            "valor": 12.42,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CHASSI": {
        "total": 2095.7,
        "itens": [
          {
            "desc": "VENEZIANA CB01460482 *CHASSI*",
            "valor": 446.5,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "AMORTECEDOR BATENTE POLIURETANO 21020013 *CHASSI*",
            "valor": 1649.2,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ELETRICA": {
        "total": 80.03999999999999,
        "itens": [
          {
            "desc": "ABRACADEIRA NYLON 13.5MM X 540MM PRETA *ELETRICA*",
            "valor": 65.61,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON 39CM 400 X 4.8 *ELETRICA*",
            "valor": 7.5,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON PRETA 280MM X 4.8MM  *ELETRICA*",
            "valor": 6.93,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CORTE BASE": {
        "total": 4733.620000000001,
        "itens": [
          {
            "desc": "PINHAO CB01437885 *CORTE BASE*",
            "valor": 332.75,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ADAPTADOR CB01478047 *CORTE BASE*",
            "valor": 326.59,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL VEDACAO CB01477814 *CORTE BASE*",
            "valor": 26.38,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "APOIO CB11420671 *CORTE BASE*",
            "valor": 82.67,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "DISCO 22POL 5 FACAS 011815 REFORCADO *CORTE BASE*",
            "valor": 1388.63,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT16118 *CORTE BASE*",
            "valor": 231.98,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CB01477813 *CORTE BASE*",
            "valor": 99.89,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO  JD9051/JD9116/759/752 *CORTE BASE*",
            "valor": 1532.4,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CB01477812 *CORTE BASE*",
            "valor": 165.33,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO 19H2728 *CORTE BASE*",
            "valor": 77.64,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO R150997 *CORTE BASE*",
            "valor": 197.81,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CHAPA CANELA ACO 1045 MC1429730 *CORTE BASE*",
            "valor": 271.55,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 75.36,
        "itens": [
          {
            "desc": "VEDACAO AT63055 *HIDRAULICA*",
            "valor": 75.36,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 620.7,
        "itens": [
          {
            "desc": "CARCACA CB01426115 *ROLO ALIMENTACAO*",
            "valor": 566.7,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO 19H3033 *ROLO ALIMENTACAO*",
            "valor": 54,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "TREM FORCA": {
        "total": 1894.73,
        "itens": [
          {
            "desc": "ROLAMENTO CARCACA AXT19838 00033836 *TREM FORCA*",
            "valor": 1108.42,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO MANGUEIRA XPD36BTX *TREM FORCA*",
            "valor": 786.31,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22521": {
      "HIDRAULICA": {
        "total": 357.18,
        "itens": [
          {
            "desc": "MANGUEIRA RE538291 RE525509 *HIDRAULICA*",
            "valor": 357.18,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      }
    },
    "22522": {
      "RODANTE": {
        "total": 62.86,
        "itens": [
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 62.86,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22523": {
      "RODANTE": {
        "total": 141.09,
        "itens": [
          {
            "desc": "ALETA HASTE ROTULA *RODANTE* 3000215",
            "valor": 141.09,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22524": {
      "TREM FORCA": {
        "total": 1059.9499999999998,
        "itens": [
          {
            "desc": "TAMPA AT173181 *TREM FORCA*",
            "valor": 273.64,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO MANGUEIRA XPD36BTX *TREM FORCA*",
            "valor": 786.31,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 885.3599999999999,
        "itens": [
          {
            "desc": "ANEL 990029001 *MOTOR*",
            "valor": 93.88,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "JUNTA R522023 *MOTOR*",
            "valor": 64.25,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "FLANGE MOTOR DO CORTE BASE C.JD 010 *MOTOR*",
            "valor": 194.78,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO N14822 *MOTOR*",
            "valor": 307,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "INDICADOR DE NIVEL 0080284428 *MOTOR*",
            "valor": 26.41,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SUSPIRO YZ106688 *MOTOR*",
            "valor": 30,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO SEXTAVADO 19H2716 *MOTOR*",
            "valor": 69,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA RE67746 *MOTOR*",
            "valor": 100.04,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 6.14,
        "itens": [
          {
            "desc": "BUCHA 0110038334 *DIVISOR LINHA*",
            "valor": 6.14,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "RODANTE": {
        "total": 62.86,
        "itens": [
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 62.86,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "PNEUMATICA": {
        "total": 49.85,
        "itens": [
          {
            "desc": "MANGUEIRA OLEO GRAXA 3/8 *PNEUMATICA*",
            "valor": 49.85,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ELEVADOR": {
        "total": 1646.24,
        "itens": [
          {
            "desc": "FLANGE LISA ELEVACAO 17 C.JD 085 *ELEVADOR*",
            "valor": 421.31,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "KIT MANCAL FIXACAO L/D L/E C.JD 123 *ELEVADOR*",
            "valor": 562.71,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL DA PONTA DO PIRULITO C.JD 001 *ELEVADOR*",
            "valor": 239.58,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT10691 AXT20450 *ELEVADOR*",
            "valor": 58.47,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA 0110005999 *ELEVADOR*",
            "valor": 9.71,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PORCA BT573A *ELEVADOR*",
            "valor": 29.28,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA 0290251912 *ELEVADOR*",
            "valor": 33.26,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA CB01432007 *ELEVADOR*",
            "valor": 13.05,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487621 *ELEVADOR*",
            "valor": 65.21,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487625 *ELEVADOR*",
            "valor": 102.42,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT11485 L220860 *ELEVADOR*",
            "valor": 111.24,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 2061.82,
        "itens": [
          {
            "desc": "ANEL DO ROLO MAIOR C.JD 043 *EXT PRIMARIO*",
            "valor": 242.33,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL ROLO MENOR C.JD 042 *EXT PRIMARIO*",
            "valor": 194.49,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SUPORTE AXT19229 AXT15471 *EXT PRIMARIO*",
            "valor": 1625,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CHASSI": {
        "total": 2363.36,
        "itens": [
          {
            "desc": "AMORTECEDOR BATENTE POLIURETANO 21020013 *CHASSI*",
            "valor": 1649.2,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT20594 045821 *CHASSI*",
            "valor": 662.9,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "BUCHA MESA DO GIRO CB01488966 *CHASSI*",
            "valor": 51.26,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 60.120000000000005,
        "itens": [
          {
            "desc": "PARAFUSO 19H3033 *ROLO ALIMENTACAO*",
            "valor": 36,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PORCA 14H1040 *ROLO ALIMENTACAO*",
            "valor": 24.12,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ELETRICA": {
        "total": 1277.94,
        "itens": [
          {
            "desc": "ABRACADEIRA NYLON 13.5MM X 540MM PRETA *ELETRICA*",
            "valor": 65.61,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CHICOTE AXT10666 *ELETRICA*",
            "valor": 1197.9,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON 39CM 400 X 4.8 *ELETRICA*",
            "valor": 7.5,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON PRETA 280MM X 4.8MM  *ELETRICA*",
            "valor": 6.93,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO PRE TOMBADOR": {
        "total": 80.73,
        "itens": [
          {
            "desc": "KIT CILINDRO AH212090 *ROLO PRE TOMBADOR*",
            "valor": 80.73,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "CORTADOR": {
        "total": 76.57,
        "itens": [
          {
            "desc": "KIT CILINDRO HIDRAULICO AHC13485 *CORTADOR*",
            "valor": 76.57,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "PNEU": {
        "total": 46.57,
        "itens": [
          {
            "desc": "ARRUELA T151797 *PNEU*",
            "valor": 46.57,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22526": {
      "ELEVADOR": {
        "total": 10928.68,
        "itens": [
          {
            "desc": "KIT REPARO CILINDRO *ELEVADOR* AH212101 (B)",
            "valor": 290.9,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA 0110005999 *ELEVADOR*",
            "valor": 9.71,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO GIRO CXT29010 CB01487615 *ELEVADOR*",
            "valor": 113.67,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CALCO CXT19061 *ELEVADOR*",
            "valor": 13.62,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FLANGE LISA ELEVACAO 17 C.JD 085 *ELEVADOR*",
            "valor": 421.31,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "KIT MANCAL FIXACAO L/D L/E C.JD 123 *ELEVADOR*",
            "valor": 562.71,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL DA PONTA DO PIRULITO C.JD 001 *ELEVADOR*",
            "valor": 239.58,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487621 *ELEVADOR*",
            "valor": 65.21,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "POLIA CENTRAL CB01437522 031448 *ELEVADOR*",
            "valor": 644.22,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ASSOALHO LISO EXTENDIDO 21990048 *ELEVADOR*",
            "valor": 8240.42,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO GIRO CXT29010 CB01487615 *ELEVADOR*",
            "valor": 113.67,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487625 *ELEVADOR*",
            "valor": 102.42,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT11485 L220860 *ELEVADOR*",
            "valor": 111.24,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "RODANTE": {
        "total": 1727.5499999999997,
        "itens": [
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 62.86,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO  19H3196 *RODANTE*",
            "valor": 21.29,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO 0121326069 *RODANTE*",
            "valor": 895.56,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO ROLO CONICO 52400/618 F003815 *RODANTE*",
            "valor": 388.07,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "TAMPAO DRENO CE20714 *RODANTE*",
            "valor": 19.12,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO  19H3196 *RODANTE*",
            "valor": 340.65,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 8491.48,
        "itens": [
          {
            "desc": "MANGUEIRA GH781-10 *HIDRAULICA*",
            "valor": 23.76,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA10FJA10 *HIDRAULICA*",
            "valor": 49.04,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO FEMEA GIRATORIA RETA JIC *HIDRAULICA*",
            "valor": 27.64,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA12FJA12 *HIDRAULICA*",
            "valor": 107.81,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 111.76,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 117.35,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA12FJ12 *HIDRAULICA*",
            "valor": 210.42,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA12FJA12 *HIDRAULICA*",
            "valor": 107.81,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 145.29,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-6 *HIDRAULICA*",
            "valor": 31.71,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1BA16FJA16 1EA16FJA16 *HIDRAULICA*",
            "valor": 145.7,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA12FJC12 *HIDRAULICA*",
            "valor": 69.04,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-6 *HIDRAULICA*",
            "valor": 35.05,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH493-16 *HIDRAULICA*",
            "valor": 138.18,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 68.73,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH493-16 *HIDRAULICA*",
            "valor": 157.02,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 73.65,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-4 *HIDRAULICA*",
            "valor": 65.54,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-4 *HIDRAULICA*",
            "valor": 69.18,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA8FJ8 *HIDRAULICA*",
            "valor": 42.88,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA6FJA4 *HIDRAULICA*",
            "valor": 56.76,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA6FJB4 *HIDRAULICA*",
            "valor": 55.68,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETA 1.5/16POL-12 1BA16FJ16 *HIDRAULICA*",
            "valor": 138.58,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-4 *HIDRAULICA*",
            "valor": 80.54,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-4 *HIDRAULICA*",
            "valor": 111.05,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-4 *HIDRAULICA*",
            "valor": 130.12,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-4 *HIDRAULICA*",
            "valor": 158.74,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA12FJ12 *HIDRAULICA*",
            "valor": 175.35,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA6FJ4 *HIDRAULICA*",
            "valor": 79.8,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-8 *HIDRAULICA*",
            "valor": 298.37,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETO 1AA6FJ6 *HIDRAULICA*",
            "valor": 121.04,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA6FJB6 *HIDRAULICA*",
            "valor": 139.76,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA6FJ4 *HIDRAULICA*",
            "valor": 79.8,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1BA16FJA16 1EA16FJA16 *HIDRAULICA*",
            "valor": 145.7,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "INTERRUPTOR PRESSAO CB01447959 *HIDRAULICA*",
            "valor": 888.23,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETA 1.5/16POL-12 1BA16FJ16 *HIDRAULICA*",
            "valor": 277.16,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH493-16 *HIDRAULICA*",
            "valor": 659.47,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH506-16 *HIDRAULICA*",
            "valor": 871.13,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA12FJ12 *HIDRAULICA*",
            "valor": 350.7,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-16 *HIDRAULICA*",
            "valor": 39.48,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-16 *HIDRAULICA*",
            "valor": 42.34,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA16FJB16 *HIDRAULICA*",
            "valor": 98.98,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA16FJC16 *HIDRAULICA*",
            "valor": 131.07,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETA 1BA16FR16 4SA16FR16 *HIDRAULICA*",
            "valor": 80.42,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 88.01,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 105.51,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 109.98,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA12FJA12 *HIDRAULICA*",
            "valor": 107.81,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETO 1AA16FJ16 *HIDRAULICA*",
            "valor": 107.23,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH506-16 *HIDRAULICA*",
            "valor": 524.63,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA12FJB12 *HIDRAULICA*",
            "valor": 440.48,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "PNEU": {
        "total": 48.9,
        "itens": [
          {
            "desc": "ARRUELA T151797 *PNEU*",
            "valor": 37.26,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA T151797 *PNEU*",
            "valor": 11.64,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 636.24,
        "itens": [
          {
            "desc": "PARAFUSO SEXTAVADO 19H2716 *MOTOR*",
            "valor": 55.2,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO SEXTAVADO 19H2716 *MOTOR*",
            "valor": 17.25,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO N14822 *MOTOR*",
            "valor": 307,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "INDICADOR DE NIVEL 0080284428 *MOTOR*",
            "valor": 26.41,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SUSPIRO YZ106688 *MOTOR*",
            "valor": 30,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "TAMPAO DRENO CE20502 *MOTOR*",
            "valor": 24.27,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA 24M7242 *MOTOR*",
            "valor": 34.33,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO SEXTAVADO 19M8002 *MOTOR*",
            "valor": 141.78,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CORTADOR": {
        "total": 73.02,
        "itens": [
          {
            "desc": "CONEXAO ANGULO AT35123 *CORTADOR*",
            "valor": 73.02,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 611.11,
        "itens": [
          {
            "desc": "ANEL DO ROLO MAIOR C.JD 043 *EXT PRIMARIO*",
            "valor": 242.33,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL ROLO MENOR C.JD 042 *EXT PRIMARIO*",
            "valor": 194.49,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "ISOLADOR CB01421974 *EXT PRIMARIO*",
            "valor": 174.29,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 36,
        "itens": [
          {
            "desc": "PARAFUSO 19H3033 *ROLO ALIMENTACAO*",
            "valor": 36,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 38.48,
        "itens": [
          {
            "desc": "PARACHOQUE 810384900 *DIVISOR LINHA*",
            "valor": 38.48,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ELETRICA": {
        "total": 145.65,
        "itens": [
          {
            "desc": "ABRACADEIRA NYLON 13.5MM X 540MM PRETA *ELETRICA*",
            "valor": 131.22,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON 39CM 400 X 4.8 *ELETRICA*",
            "valor": 7.5,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON PRETA 280MM X 4.8MM  *ELETRICA*",
            "valor": 6.93,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "TREM FORCA": {
        "total": 2946.9100000000003,
        "itens": [
          {
            "desc": "ROLAMENTO CARCACA AXT19838 00033836 *TREM FORCA*",
            "valor": 554.21,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO MANGUEIRA XPD36BTX *TREM FORCA*",
            "valor": 786.31,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ESPACADOR CXT11435 *TREM FORCA*",
            "valor": 13.33,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SENSOR VELOCIDADE CXT22077 CXT14340 *TREM FORCA*",
            "valor": 1476.66,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO SEXTAVADO 19M8639 *TREM FORCA*",
            "valor": 116.4,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CORTE BASE": {
        "total": 4459.81,
        "itens": [
          {
            "desc": "SERV MANUT ESTRUTURA *CORTE BASE*",
            "valor": 4366.67,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA T83426 *CORTE BASE*",
            "valor": 93.14,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "TRUCK": {
        "total": 4447.58,
        "itens": [
          {
            "desc": "ANEL O 0491326957 *TRUCK*",
            "valor": 14.07,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT29415 *TRUCK*",
            "valor": 247.08,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PORCA 0290233023 *TRUCK*",
            "valor": 166.28,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "KIT MANCAL TRUCK CJD058 *TRUCK*",
            "valor": 4020.15,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ARREFECIMENTO": {
        "total": 2330.1400000000003,
        "itens": [
          {
            "desc": "MANGUEIRA HXE43222 *ARREFECIMENTO*",
            "valor": 417.35,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA HXE43222 *ARREFECIMENTO*",
            "valor": 417.35,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA CB01472639 *ARREFECIMENTO*",
            "valor": 1495.44,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "TRANSMISSAO": {
        "total": 73.65,
        "itens": [
          {
            "desc": "PARAFUSO 19M7969 *TRANSMISSAO*",
            "valor": 73.65,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22527": {
      "HIDRAULICA": {
        "total": 351.09,
        "itens": [
          {
            "desc": "KIT BOMBA CXT16281 *HIDRAULICA*",
            "valor": 351.09,
            "data": "2026-01-04",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "ELEVADOR": {
        "total": 10469.46,
        "itens": [
          {
            "desc": "KIT REPARO CILINDRO *ELEVADOR* AH212101 (B)",
            "valor": 290.9,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "SUPORTE CB11462481 *ELEVADOR*",
            "valor": 208.96,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "FLANGE LISA ELEVACAO 17 C.JD 085 *ELEVADOR*",
            "valor": 421.31,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL DA PONTA DO PIRULITO C.JD 001 *ELEVADOR*",
            "valor": 239.58,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO RIGIDO ESFERA Y209 C3 *ELEVADOR*",
            "valor": 426.17,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "APOIO 0191372460 *ELEVADOR*",
            "valor": 157.75,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "BOJO INFERIOR ELEVADOR AXT12812 *ELEVADOR*",
            "valor": 487.92,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "KIT  DE ENGRENAGEM BLINDAGEM MC 6199 *ELEVADOR*",
            "valor": 3959.07,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "KIT PARAFUSO COMPLETO MC5000 *ELEVADOR*",
            "valor": 1825.64,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PORTA CB11473203 *ELEVADOR*",
            "valor": 168.78,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "RETENTOR 0290210219 *ELEVADOR*",
            "valor": 14.12,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "TALISCA ELEVADOR 3 VINCOS 021569 *ELEVADOR*",
            "valor": 1931.92,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT10691 AXT20450 *ELEVADOR*",
            "valor": 58.47,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487621 *ELEVADOR*",
            "valor": 65.21,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487625 *ELEVADOR*",
            "valor": 102.42,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT11485 L220860 *ELEVADOR*",
            "valor": 111.24,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "RODANTE": {
        "total": 62.86,
        "itens": [
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 62.86,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 791.29,
        "itens": [
          {
            "desc": "ABRACADEIRA RE67746 *MOTOR*",
            "valor": 100.04,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          },
          {
            "desc": "VEDACAO YZ100016 YZ590140 *MOTOR*",
            "valor": 23.07,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ISOLADOR 0290042754 *MOTOR*",
            "valor": 61.23,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL VEDACAO N153493 *MOTOR*",
            "valor": 34.81,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARACHOQUE 0151333927 *MOTOR*",
            "valor": 139.73,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO N14822 *MOTOR*",
            "valor": 307,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "INDICADOR DE NIVEL 0080284428 *MOTOR*",
            "valor": 26.41,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SUSPIRO YZ106688 *MOTOR*",
            "valor": 30,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO SEXTAVADO 19H2716 *MOTOR*",
            "valor": 69,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 1344.85,
        "itens": [
          {
            "desc": "PINO AXT12337 *DIVISOR LINHA*",
            "valor": 135.02,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA 24H1245 *DIVISOR LINHA*",
            "valor": 5.01,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PINO DIVISOR LINHA AXT13650 *DIVISOR LINHA*",
            "valor": 328.37,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PORCA CXT18099 *DIVISOR LINHA*",
            "valor": 32.61,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "COROA REFORCADA 018307 *DIVISOR LINHA*",
            "valor": 805.36,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARACHOQUE 810384900 *DIVISOR LINHA*",
            "valor": 38.48,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 436.82000000000005,
        "itens": [
          {
            "desc": "ANEL DO ROLO MAIOR C.JD 043 *EXT PRIMARIO*",
            "valor": 242.33,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL ROLO MENOR C.JD 042 *EXT PRIMARIO*",
            "valor": 194.49,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "NAO"
          }
        ]
      },
      "CHASSI": {
        "total": 1713.93,
        "itens": [
          {
            "desc": "AMORTECEDOR BATENTE POLIURETANO 21020013 *CHASSI*",
            "valor": 1649.2,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "BUCHA CHASSI DIVISOR CXT20552 *CHASSI*",
            "valor": 15.53,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "BUCHA 0110022801 *CHASSI*",
            "valor": 49.2,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 12.06,
        "itens": [
          {
            "desc": "PORCA 14H1040 *ROLO ALIMENTACAO*",
            "valor": 12.06,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ELETRICA": {
        "total": 80.03999999999999,
        "itens": [
          {
            "desc": "ABRACADEIRA NYLON 13.5MM X 540MM PRETA *ELETRICA*",
            "valor": 65.61,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON 39CM 400 X 4.8 *ELETRICA*",
            "valor": 7.5,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ABRACADEIRA NYLON PRETA 280MM X 4.8MM  *ELETRICA*",
            "valor": 6.93,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CORTE BASE": {
        "total": 4274.360000000001,
        "itens": [
          {
            "desc": "PINHAO CB01437885 *CORTE BASE*",
            "valor": 332.75,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "TAMPAO CORTE BASE 0711349370 *CORTE BASE*",
            "valor": 10.1,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ADAPTADOR CB01478047 *CORTE BASE*",
            "valor": 326.59,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL VEDACAO CB01477814 *CORTE BASE*",
            "valor": 26.38,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "APOIO CB11420671 *CORTE BASE*",
            "valor": 82.67,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "DISCO 22POL 5 FACAS 011815 REFORCADO *CORTE BASE*",
            "valor": 1388.63,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT16118 *CORTE BASE*",
            "valor": 231.98,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CB01477813 *CORTE BASE*",
            "valor": 99.89,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO  JD9051/JD9116/759/752 *CORTE BASE*",
            "valor": 1532.4,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CB01477812 *CORTE BASE*",
            "valor": 165.33,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO 19H2728 *CORTE BASE*",
            "valor": 77.64,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "PICADOR": {
        "total": 44.84,
        "itens": [
          {
            "desc": "PARAFUSO 19M7488 *PICADOR*",
            "valor": 44.84,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO PRE TOMBADOR": {
        "total": 823.25,
        "itens": [
          {
            "desc": "ACOPLAMENTO INTERNO 018308 *ROLO PRE TOMBADOR*",
            "valor": 823.25,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CABINE": {
        "total": 47.37,
        "itens": [
          {
            "desc": "ISOLADOR AT227815 *CABINE*",
            "valor": 47.37,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "TREM FORCA": {
        "total": 157.26,
        "itens": [
          {
            "desc": "CONEXAO MANGUEIRA XPD36BTX *TREM FORCA*",
            "valor": 157.26,
            "data": "2026-01-07",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "22528": {
      "ELEVADOR": {
        "total": 1319.48,
        "itens": [
          {
            "desc": "HASTE CILINDRO GIRO 3011560 H211932 *ELEVADOR*",
            "valor": 1028.58,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "KIT REPARO CILINDRO *ELEVADOR* AH212101 (B)",
            "valor": 290.9,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      }
    },
    "52500": {
      "ROLO ALIMENTACAO": {
        "total": 875,
        "itens": [
          {
            "desc": "EIXO ESTRIADO CXT20509 *ROLO ALIMENTACAO*",
            "valor": 875,
            "data": "2026-01-03",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 663.62,
        "itens": [
          {
            "desc": "MANGUEIRA GH781-8 *HIDRAULICA*",
            "valor": 663.62,
            "data": "2026-01-03",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      }
    },
    "52501": {
      "ROLO ALIMENTACAO": {
        "total": 875,
        "itens": [
          {
            "desc": "EIXO ESTRIADO CXT20509 *ROLO ALIMENTACAO*",
            "valor": 875,
            "data": "2026-01-03",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 193.63,
        "itens": [
          {
            "desc": "CONEXAO 1AA8FJ8 *HIDRAULICA*",
            "valor": 85.76,
            "data": "2026-01-03",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 1AA8MP8 *HIDRAULICA*",
            "valor": 107.87,
            "data": "2026-01-03",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      }
    },
    "52503": {
      "CARROCERIA": {
        "total": 204.24,
        "itens": [
          {
            "desc": "ISOLADOR CXT13686 *CARROCERIA*",
            "valor": 96.6,
            "data": "2026-01-03",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "TRAVA 0280039677 *CARROCERIA*",
            "valor": 107.64,
            "data": "2026-01-03",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "CHASSI": {
        "total": 1884.45,
        "itens": [
          {
            "desc": "PENEIRA CB01487411 *CHASSI*",
            "valor": 1884.45,
            "data": "2026-01-03",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "PICADOR": {
        "total": 2194.94,
        "itens": [
          {
            "desc": "EIXO COM PINHAO CE32781 *PICADOR*",
            "valor": 619.85,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA CXT36393 *PICADOR*",
            "valor": 70.07,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL T80123 *PICADOR*",
            "valor": 6.64,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO DC221239 *PICADOR*",
            "valor": 335.23,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CB01466740 CB01465465 *PICADOR*",
            "valor": 711.86,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "DISCO 0621305006 *PICADOR*",
            "valor": 138.29,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO CE32665 *PICADOR*",
            "valor": 300,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CXT23507 CXT12341 *PICADOR*",
            "valor": 13,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "CORTE BASE": {
        "total": 1821.8300000000002,
        "itens": [
          {
            "desc": "DISCO 22POL 5 FACAS 011815 REFORCADO *CORTE BASE*",
            "valor": 1417.44,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA T83426 *CORTE BASE*",
            "valor": 5.6,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA T83426 *CORTE BASE*",
            "valor": -5.6,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA T83426 *CORTE BASE*",
            "valor": 1.4,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA T83426 *CORTE BASE*",
            "valor": 70,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "ADAPTADOR CB01478047 *CORTE BASE*",
            "valor": 332.99,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 60.09,
        "itens": [
          {
            "desc": "ENGRENAGEM CORRENTE AXT13039 *EXT PRIMARIO*",
            "valor": 60.09,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "TRUCK": {
        "total": 404.38,
        "itens": [
          {
            "desc": "PLACA CXT29415 *TRUCK*",
            "valor": 370.62,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL O 0491326957 *TRUCK*",
            "valor": 33.76,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 6767.3899999999985,
        "itens": [
          {
            "desc": "CONEXAO 45 4SA16FRA16 1EA16FRA16 *HIDRAULICA*",
            "valor": 107.56,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 90 4SA16FRB16 1EA16FRB16 *HIDRAULICA*",
            "valor": 115.98,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO RETO 1E16FH16 *HIDRAULICA*",
            "valor": 224.45,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 1AA8FJ8 *HIDRAULICA*",
            "valor": 85.76,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "TERMINAL FEMEA  45 1E16FHA16  *HIDRAULICA*",
            "valor": 778.68,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 1AA12FJ12 *HIDRAULICA*",
            "valor": 350.7,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO RETA 1BA16FR16 4SA16FR16 *HIDRAULICA*",
            "valor": 804.05,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA GH506-16 *HIDRAULICA*",
            "valor": 2287.62,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 817.23,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 817.23,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": -817.23,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA GH781-12 *HIDRAULICA*",
            "valor": 544.82,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "KIT BOMBA CXT16281 *HIDRAULICA*",
            "valor": 520.74,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA 0080052391 *HIDRAULICA*",
            "valor": 129.8,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "TREM FORCA": {
        "total": 4077.1099999999997,
        "itens": [
          {
            "desc": "BOMBA AT214865 *TREM FORCA*",
            "valor": 2689.16,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA T155644 *TREM FORCA*",
            "valor": 1387.95,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "CABINE": {
        "total": 720,
        "itens": [
          {
            "desc": "VALVULA RETENCAO AH205583 *CABINE*",
            "valor": 720,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 9315,
        "itens": [
          {
            "desc": "INTERCOOLER CB01479938 *MOTOR*",
            "valor": 9315,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "ELEVADOR": {
        "total": 341.18,
        "itens": [
          {
            "desc": "ROLAMENTO RIGIDO ESFERA Y209 C3 *ELEVADOR*",
            "valor": 110.44,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "CORRENTE ROLOS 0211308168 *ELEVADOR*",
            "valor": 214.5,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "ELO CORRENTE SW2060COUS *ELEVADOR*",
            "valor": 16.24,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "CORTADOR": {
        "total": 274.39,
        "itens": [
          {
            "desc": "ADAPTADOR 0251308308 *CORTADOR*",
            "valor": 274.39,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      }
    },
    "52505": {
      "ELETRICA": {
        "total": 102.47,
        "itens": [
          {
            "desc": "FITA ISOLANTE TECIDO 19MM X 10M *ELETRICA*",
            "valor": 18.66,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "ABRACADEIRA NYLON 13.5MM X 540MM PRETA *ELETRICA*",
            "valor": 63.85,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "ABRACADEIRA NYLON 150MM X 3,6MM T30R *ELETRICA*",
            "valor": 5.96,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "ABRACADEIRA NYLON PRETA 280MM X 4.8MM  *ELETRICA*",
            "valor": 14,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      }
    },
    "52506": {
      "TRANSMISSAO": {
        "total": 1549.94,
        "itens": [
          {
            "desc": "OLEO LUBR. 85W140 API GL-5 *TRANSMISSAO*",
            "valor": 1549.94,
            "data": "2026-01-02",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 335.75,
        "itens": [
          {
            "desc": "KIT VEDACAO 191747A1 *HIDRAULICA*",
            "valor": 335.75,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      }
    },
    "52508": {
      "HIDRAULICA": {
        "total": 223.83,
        "itens": [
          {
            "desc": "KIT VEDACAO 191747A1 *HIDRAULICA*",
            "valor": 223.83,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      }
    },
    "52511": {
      "ELETRICA": {
        "total": 53,
        "itens": [
          {
            "desc": "ESCOVA AUTOMOTIVA 12V NDSX-8216 *ELETRICA*",
            "valor": 53,
            "data": "2026-01-04",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "INDUZIDO PARTIDA RE39245 *ELETRICA*",
            "valor": 385.29,
            "data": "2026-01-04",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "INDUZIDO PARTIDA RE39245 *ELETRICA*",
            "valor": -385.29,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "MOTOR": {
        "total": 37860.939999999995,
        "itens": [
          {
            "desc": "CABECOTE RE523680 *MOTOR*",
            "valor": 37728.81,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "FILTRO LUBR. P553161 DN / DZ101884 JD *MOTOR*",
            "valor": 132.13,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 2079.3,
        "itens": [
          {
            "desc": "MANGUEIRA GH506-16 *HIDRAULICA*",
            "valor": 1525.08,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 90 1BA16FJB16 4SA16FJB16 *HIDRAULICA*",
            "valor": 127.63,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO RETA 1.5/16POL-12 1BA16FJ16 *HIDRAULICA*",
            "valor": 69.18,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 90 1AA12FJB12 *HIDRAULICA*",
            "valor": 110.12,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 1AA12FJ12 *HIDRAULICA*",
            "valor": 140.28,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO RETO 1AA16FJ16 *HIDRAULICA*",
            "valor": 107.01,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "TRANSMISSAO": {
        "total": 100.21,
        "itens": [
          {
            "desc": "OLEO LUBR. 85W140 API GL-5 *TRANSMISSAO*",
            "valor": 100.21,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      }
    },
    "52515": {
      "TRUCK": {
        "total": 404.38,
        "itens": [
          {
            "desc": "PLACA CXT29415 *TRUCK*",
            "valor": 370.62,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL O 0491326957 *TRUCK*",
            "valor": 33.76,
            "data": "2026-01-05",
            "empresa": "URUACU",
            "reforma": "NAO"
          }
        ]
      },
      "CABINE": {
        "total": 720,
        "itens": [
          {
            "desc": "VALVULA RETENCAO AH205583 *CABINE*",
            "valor": 720,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 520.74,
        "itens": [
          {
            "desc": "KIT BOMBA CXT16281 *HIDRAULICA*",
            "valor": 520.74,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 842.76,
        "itens": [
          {
            "desc": "BUCHA 0610005800 *DIVISOR LINHA*",
            "valor": 18,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "PINO DIVISOR LINHA AXT13650 *DIVISOR LINHA*",
            "valor": 824.76,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "ARREFECIMENTO": {
        "total": 5263.59,
        "itens": [
          {
            "desc": "MANGUEIRA CB01472639 *ARREFECIMENTO*",
            "valor": 2307.78,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "RESERVATORIO AGUA RADIADOR 125726 *ARREFECIMENTO*",
            "valor": 2955.81,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "CORTADOR": {
        "total": 40.73,
        "itens": [
          {
            "desc": "BUCHA 0111334420 *CORTADOR*",
            "valor": 40.73,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 20.25,
        "itens": [
          {
            "desc": "ARRUELA 24M7242 *MOTOR*",
            "valor": 20.25,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "RODANTE": {
        "total": 318,
        "itens": [
          {
            "desc": "PARAFUSO  19H3196 *RODANTE*",
            "valor": 318,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "CORTE BASE": {
        "total": 1417.44,
        "itens": [
          {
            "desc": "DISCO 22POL 5 FACAS 011815 REFORCADO *CORTE BASE*",
            "valor": 1417.44,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      }
    },
    "52516": {
      "CABINE": {
        "total": 720,
        "itens": [
          {
            "desc": "VALVULA RETENCAO AH205583 *CABINE*",
            "valor": 720,
            "data": "2026-01-06",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "ADMISSAO": {
        "total": 623.3,
        "itens": [
          {
            "desc": "FILTRO AR EX P618689 DN / HXE11090 JD *ADMISSAO*",
            "valor": 448.12,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "FILTRO AR IN P618690 DN *ADMISSAO*",
            "valor": 175.18,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "SIST COMB": {
        "total": 340.81,
        "itens": [
          {
            "desc": "FILTRO COMB. P551124 DN *SIST COMB*",
            "valor": 203.35,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "FILTRO COMB. P551858 DN *SIST COMB*",
            "valor": 137.46,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 485.03,
        "itens": [
          {
            "desc": "FILTRO LUBR. P553161 DN / DZ101884 JD *MOTOR*",
            "valor": 132.13,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          },
          {
            "desc": "OLEO LUBR. MINERAL 15W40 API CI-4/SL *MOTOR*",
            "valor": 352.9,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      },
      "TRANSMISSAO": {
        "total": 100.21,
        "itens": [
          {
            "desc": "OLEO LUBR. 85W140 API GL-5 *TRANSMISSAO*",
            "valor": 100.21,
            "data": "2026-01-07",
            "empresa": "URUACU",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62502": {
      "HIDRAULICA": {
        "total": 2035,
        "itens": [
          {
            "desc": "SERV MANUT CILINDRO *HIDRAULICA*",
            "valor": 2035,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62503": {
      "MOTOR": {
        "total": 1749.6,
        "itens": [
          {
            "desc": "SERV MANUT TURBINA *MOTOR*",
            "valor": 1749.6,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MEC DEDICADO": {
        "total": 2370.87,
        "itens": [
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 2370.87,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      }
    },
    "62504": {
      "TRANSMISSAO": {
        "total": 10.23,
        "itens": [
          {
            "desc": "PARAFUSO 19M7784 *TRANSMISSAO*",
            "valor": 10.23,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "PICADOR": {
        "total": 377.57,
        "itens": [
          {
            "desc": "LAMINA PICADORA 95MM X 910MM CXT12136 *PICADOR*",
            "valor": 377.57,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 8037.35,
        "itens": [
          {
            "desc": "CONEXAO RETO 1AA8FJ6 *HIDRAULICA*",
            "valor": 17.84,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA GH506-16 *HIDRAULICA*",
            "valor": 236.57,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "SERV MANUT MOTOR HIDRAULICO *HIDRAULICA*",
            "valor": 6631,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ACOPLADOR HIDRAULICO P/ GRAXA LUB 13 *HIDRAULICA*",
            "valor": 59.1,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "OLEO LUBR. MINERAL 15W40 API CI-4/SL *HIDRAULICA*",
            "valor": 504.1,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 45 1AA6FJA6 *HIDRAULICA*",
            "valor": 30.98,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETO 1AA6FJ6 *HIDRAULICA*",
            "valor": 15.41,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "MANGUEIRA GH781-6 *HIDRAULICA*",
            "valor": 84.54,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA6FJA6 *HIDRAULICA*",
            "valor": -30.98,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETO 1AA6FJ6 *HIDRAULICA*",
            "valor": -15.41,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "OLEO LUBR. MINERAL 15W40 API CI-4/SL *HIDRAULICA*",
            "valor": 504.2,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 1076.08,
        "itens": [
          {
            "desc": "SENSOR VELOCIDADE CXT10419 *EXT PRIMARIO*",
            "valor": 931.56,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ACOPLAMENTO XPD36BTX *EXT PRIMARIO*",
            "valor": 144.52,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "CORTADOR": {
        "total": 12253.85,
        "itens": [
          {
            "desc": "VALVULA CONTROLE AXT22448 *CORTADOR*",
            "valor": 12253.85,
            "data": "2026-01-03",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 443.78,
        "itens": [
          {
            "desc": "EIXO ESTRIADO CXT20509 *ROLO ALIMENTACAO*",
            "valor": 443.78,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MOTOR": {
        "total": 2.23,
        "itens": [
          {
            "desc": "ANEL ORING T76938 *MOTOR*",
            "valor": 2.23,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62507": {
      "PICADOR": {
        "total": 841.89,
        "itens": [
          {
            "desc": "LAMINA PICADORA 95MM X 910MM CXT12136 *PICADOR*",
            "valor": 377.57,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "KIT ROLAMENTO KXT10053 056779 *PICADOR*",
            "valor": 446.31,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO M80253 *PICADOR*",
            "valor": 18.01,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 686.52,
        "itens": [
          {
            "desc": "KIT RETENTOR CXT20511 *ROLO ALIMENTACAO*",
            "valor": 686.52,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "TREM FORCA": {
        "total": 188.6,
        "itens": [
          {
            "desc": "ADAPTADOR 38H1287 *TREM FORCA*",
            "valor": 188.6,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 1978.34,
        "itens": [
          {
            "desc": "CONEXAO RETA 1BA16FR16 4SA16FR16 *HIDRAULICA*",
            "valor": 82.52,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA GH506-16 *HIDRAULICA*",
            "valor": 171,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO RETA 1BA16FR16 4SA16FR16 *HIDRAULICA*",
            "valor": 165.04,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "TERMINAL FEMEA  45 1E16FHA16  *HIDRAULICA*",
            "valor": 312.36,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "TERMINAL FEMEA  45 1E16FHA16  *HIDRAULICA*",
            "valor": 312.36,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETA 1BA16FR16 4SA16FR16 *HIDRAULICA*",
            "valor": 330.09,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "OLEO LUBR. MINERAL 15W40 API CI-4/SL *HIDRAULICA*",
            "valor": 604.97,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MOTOR": {
        "total": 2.23,
        "itens": [
          {
            "desc": "ANEL ORING T76938 *MOTOR*",
            "valor": 2.23,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "MANUT BASICA": {
        "total": 26.33,
        "itens": [
          {
            "desc": "DESENGRAXANTE LIMPEZA AUTOMOTIVA *MANUT BASICA*",
            "valor": 13.14,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "DESINCRUSTANTE LIMPEZA AUTOMOTIVA *MANUT BASICA*",
            "valor": 13.19,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      }
    },
    "62508": {
      "RODANTE": {
        "total": 572.4,
        "itens": [
          {
            "desc": "SERV MANUT ACIONAMENTO-CUBO REDUTOR *RODANTE*",
            "valor": 572.4,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MEC DEDICADO": {
        "total": 633.15,
        "itens": [
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 633.15,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      }
    },
    "62510": {
      "CORTADOR": {
        "total": 185.44,
        "itens": [
          {
            "desc": "KIT CILINDRO HIDRAULICO AHC13485 *CORTADOR*",
            "valor": 76.57,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "KIT VEDACAO AHC21126 *CORTADOR*",
            "valor": 89.11,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PORCA SEGURANCA M150959 *CORTADOR*",
            "valor": 19.76,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "ESCAPE": {
        "total": 1406.05,
        "itens": [
          {
            "desc": "CANO DESCARGA AXT21960 *ESCAPE*",
            "valor": 1406.05,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "ELEVADOR": {
        "total": 1329.51,
        "itens": [
          {
            "desc": "CORRENTE ROLOS 0211308168 *ELEVADOR*",
            "valor": 201.41,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "LAMINA 1190286278 *ELEVADOR* (B)",
            "valor": 115.85,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT10691 AXT20450 *ELEVADOR*",
            "valor": 52.66,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PINO AXT10692 *ELEVADOR*",
            "valor": 67.22,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CILINDRO CXT19612 CB01487608 *ELEVADOR*",
            "valor": 201.17,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO RIGIDO ESFERA Y209 C3 *ELEVADOR*",
            "valor": 101.21,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CXT28858 CXT20971 *ELEVADOR*",
            "valor": 432.24,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "APOIO 0191372460 *ELEVADOR*",
            "valor": 157.75,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "PICADOR": {
        "total": 1071.6100000000001,
        "itens": [
          {
            "desc": "DEFLETOR PICADOR CXT23029 CB01448002 *PICADOR*",
            "valor": 55.72,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PERSIANA CXT17652 *PICADOR*",
            "valor": 130.77,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "LAMINA PICADORA 95MM X 910MM CXT12136 *PICADOR*",
            "valor": 885.12,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "ADMISSAO": {
        "total": 200.43,
        "itens": [
          {
            "desc": "FILTRO AR IN CB01491505 JD / S/C *ADMISSAO*",
            "valor": 200.43,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "SIST COMB": {
        "total": 530.87,
        "itens": [
          {
            "desc": "FILTRO COMB. P551124 DN *SIST COMB*",
            "valor": 192.39,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "FILTRO COMB. P551858 DN *SIST COMB*",
            "valor": 338.48,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "ELETRICA": {
        "total": 2017.4099999999999,
        "itens": [
          {
            "desc": "INTERRUPTOR RE575247 *ELETRICA*",
            "valor": 395.56,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "CHICOTE AXT10667 AXT20376 *ELETRICA*",
            "valor": 376.59,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "LUZ TRASEIRA AXT15246 *ELETRICA*",
            "valor": 1245.26,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 1275.8300000000002,
        "itens": [
          {
            "desc": "LIMITADOR CB11458521 *DIVISOR LINHA*",
            "valor": 165.55,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "LIMITADOR CB11458522 *DIVISOR LINHA*",
            "valor": 165.27,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA 24H1542 *DIVISOR LINHA*",
            "valor": 10.36,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "SENSOR RE334232 *DIVISOR LINHA*",
            "valor": 542.35,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PINO DIVISOR LINHA AXT13650 *DIVISOR LINHA*",
            "valor": 237.15,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PORCA CXT18099 *DIVISOR LINHA*",
            "valor": 25.64,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "BRACO AXT13664 *DIVISOR LINHA*",
            "valor": 129.51,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO PRE TOMBADOR": {
        "total": 844.48,
        "itens": [
          {
            "desc": "PARAFUSO SEXTAVADO 19H2218 *ROLO PRE TOMBADOR*",
            "valor": 5.55,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT12564 *ROLO PRE TOMBADOR*",
            "valor": 428.13,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT16271 *ROLO PRE TOMBADOR*",
            "valor": 410.8,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "TRUCK": {
        "total": 400.62,
        "itens": [
          {
            "desc": "PORCA 0290233023 *TRUCK*",
            "valor": 153.54,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA CXT29415 *TRUCK*",
            "valor": 247.08,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "TREM FORCA": {
        "total": 6077.6900000000005,
        "itens": [
          {
            "desc": "SENSOR VELOCIDADE CXT22077 CXT14340 *TREM FORCA*",
            "valor": 3588.9,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "KIT REPARO 0631305870 *TREM FORCA*",
            "valor": 558.96,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PLACA T155644 *TREM FORCA*",
            "valor": 462.03,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "BRACO SERVO 1002613 *TREM FORCA*",
            "valor": 635.2,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "TAMPA AT173181 *TREM FORCA*",
            "valor": 273.64,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "KIT REPARO 0631305870 *TREM FORCA*",
            "valor": 558.96,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 4602.42,
        "itens": [
          {
            "desc": "ISOLADOR CB01421974 *EXT PRIMARIO*",
            "valor": 210.92,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "CONTROLADOR 0361384266 *EXT PRIMARIO*",
            "valor": 2195.75,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "CONTROLADOR 0361384266 *EXT PRIMARIO*",
            "valor": 2195.75,
            "data": "2026-01-07",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "TRANSMISSAO": {
        "total": 80.74,
        "itens": [
          {
            "desc": "PARAFUSO 19M7969 *TRANSMISSAO*",
            "valor": 80.74,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 280.86,
        "itens": [
          {
            "desc": "PORCA SEGURANCA 14M7397 *ROLO ALIMENTACAO*",
            "valor": 0.79,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487612 *ROLO ALIMENTACAO*",
            "valor": 280.07,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 63.64,
        "itens": [
          {
            "desc": "PARAFUSO SEXTAVADO 19H2716 *MOTOR*",
            "valor": 63.64,
            "data": "2026-01-06",
            "empresa": "CRV-GO",
            "reforma": "SIM"
          }
        ]
      },
      "CHASSI": {
        "total": 721.44,
        "itens": [
          {
            "desc": "TUBO CXT16861 *CHASSI*",
            "valor": 495.29,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          },
          {
            "desc": "SUPORTE L/D AXT15484 *CHASSI*",
            "valor": 226.15,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      },
      "CABINE": {
        "total": 722.96,
        "itens": [
          {
            "desc": "MOTOR LIMPADOR PARABRISA AH236252 *CABINE*",
            "valor": 722.96,
            "data": "2026-01-06",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62511": {
      "RODANTE": {
        "total": 1312.2,
        "itens": [
          {
            "desc": "SERV MANUT MOLA TENSORA *RODANTE*",
            "valor": 1312.2,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MEC DEDICADO": {
        "total": 189,
        "itens": [
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 189,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "TREM FORCA": {
        "total": 10000,
        "itens": [
          {
            "desc": "SERV MANUT  BOMBA HIDRAULICA *TREM FORCA*",
            "valor": 10000,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62512": {
      "ELEVADOR": {
        "total": 19406.69,
        "itens": [
          {
            "desc": "SERV MANUT ESTRUTURA *ELEVADOR*",
            "valor": 19406.69,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "SUSPENSAO": {
        "total": 1501.2,
        "itens": [
          {
            "desc": "SERV MANUT CILINDRO BATENTE *SUSPENSAO*",
            "valor": 1501.2,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "CORTADOR": {
        "total": 441,
        "itens": [
          {
            "desc": "SERV MANUT CILINDRO-PISTAO *CORTADOR*",
            "valor": 441,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 8485.04,
        "itens": [
          {
            "desc": "SERV MANUT BOMBA HIDRAULICA *EXT PRIMARIO*",
            "valor": 8055,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          },
          {
            "desc": "CARCACA CB11501068 *EXT PRIMARIO*",
            "valor": 430.04,
            "data": "2026-01-05",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 3717,
        "itens": [
          {
            "desc": "SERV MANUT MOTOR HIDRAULICO *HIDRAULICA*",
            "valor": 3717,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "TREM FORCA": {
        "total": 6507,
        "itens": [
          {
            "desc": "SERV MANUT  BOMBA HIDRAULICA *TREM FORCA*",
            "valor": 6507,
            "data": "2026-01-02",
            "empresa": "CRV-GO",
            "reforma": "NAO"
          }
        ]
      },
      "ELETRICA": {
        "total": 3662.11,
        "itens": [
          {
            "desc": "CHICOTE AXT20371 *ELETRICA*",
            "valor": 3662.11,
            "data": "2026-01-05",
            "empresa": "RUBIATABA",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62513": {
      "RODANTE": {
        "total": 2433.1200000000003,
        "itens": [
          {
            "desc": "SERV MANUT ESTEIRA *RODANTE*",
            "valor": 2052,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA CB01490885 *RODANTE*",
            "valor": 79.01,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "TIRANTE EIXO MOLA TENSORA CB01490886 *RODANTE*",
            "valor": 188.64,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "VALVULA AT333979 *RODANTE*",
            "valor": 71.87,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO CXT20658 *RODANTE*",
            "valor": 20.8,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO CXT35314 *RODANTE*",
            "valor": 20.8,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MEC DEDICADO": {
        "total": 192.15,
        "itens": [
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 192.15,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 241.54,
        "itens": [
          {
            "desc": "PINO DIVISOR LINHA AXT13650 *DIVISOR LINHA*",
            "valor": 241.54,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 62.94,
        "itens": [
          {
            "desc": "ARRUELA 24H1360 *EXT PRIMARIO*",
            "valor": 3.25,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "CONTRA PINO 0700014289 *EXT PRIMARIO*",
            "valor": 0.28,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "RESINA POLIMERO CXT22974 *EXT PRIMARIO*",
            "valor": 59.41,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 10.81,
        "itens": [
          {
            "desc": "PARAFUSO 19M9099 *MOTOR*",
            "valor": 10.81,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 2187.75,
        "itens": [
          {
            "desc": "PARAFUSO SEXTAVADO 19M7403 *HIDRAULICA*",
            "valor": 12.64,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "SERV MANUT CILINDRO *HIDRAULICA*",
            "valor": 883.5,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "SERV MANUT CILINDRO *HIDRAULICA*",
            "valor": 883.5,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA10FJB8 *HIDRAULICA*",
            "valor": 46.33,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA10FJC8 *HIDRAULICA*",
            "valor": 90.19,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA10MJ8 *HIDRAULICA*",
            "valor": 26.25,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA8MJ6 *HIDRAULICA*",
            "valor": 22.45,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA8MJ8 *HIDRAULICA*",
            "valor": 26.34,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA10FJA10 *HIDRAULICA*",
            "valor": 49.09,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA10FJA8 *HIDRAULICA*",
            "valor": 44.05,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA10FJB10 *HIDRAULICA*",
            "valor": 61.51,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA8FJC8 *HIDRAULICA*",
            "valor": 41.9,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO PRE TOMBADOR": {
        "total": 111.61,
        "itens": [
          {
            "desc": "PINO AXT15861 AXT20443 *ROLO PRE TOMBADOR*",
            "valor": 111.61,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "PICADOR": {
        "total": 75.01,
        "itens": [
          {
            "desc": "APOIO CB01474063 *PICADOR*",
            "valor": 46.34,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "TIRA CB01473209 *PICADOR*",
            "valor": 28.67,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "TRUCK": {
        "total": 7322.1,
        "itens": [
          {
            "desc": "EIXO CB01487118 *TRUCK*",
            "valor": 7322.1,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "ELEVADOR": {
        "total": 4165.44,
        "itens": [
          {
            "desc": "CORRENTE ROLO CB01433201 CT-2 TC255 *ELEVADOR*",
            "valor": 4165.44,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62514": {
      "DIVISOR LINHA": {
        "total": 276.29,
        "itens": [
          {
            "desc": "PINO DIVISOR AXT12335 *DIVISOR LINHA*",
            "valor": 130.12,
            "data": "2026-01-03",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL ORING U10776 *DIVISOR LINHA*",
            "valor": 8.63,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL ORING U10776 *DIVISOR LINHA*",
            "valor": 8.63,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "FLANGE SUPORTE ROLAMENTO AA20226 *DIVISOR LINHA*",
            "valor": 34.46,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "FLANGE SUPORTE ROLAMENTO E39751 *DIVISOR LINHA*",
            "valor": 25.69,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "PARACHOQUE 810384900 *DIVISOR LINHA*",
            "valor": 68.76,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "MOTOR": {
        "total": 1172.63,
        "itens": [
          {
            "desc": "RESERVATORIO AGUA AT323058 *MOTOR*",
            "valor": 1172.63,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "ELEVADOR": {
        "total": 10855.029999999999,
        "itens": [
          {
            "desc": "SUPORTE CB11462481 *ELEVADOR*",
            "valor": 148.78,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "AJUSTADOR AXT13251 *ELEVADOR*",
            "valor": 208.09,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "AJUSTADOR AXT13251 *ELEVADOR*",
            "valor": 208.09,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CORRENTE ESTRUTURA *ELEVADOR* AXT14824",
            "valor": 4165.44,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO 0051377934 *ELEVADOR*",
            "valor": 63.34,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "PORCA SEGURANCA N190216 *ELEVADOR*",
            "valor": 19.86,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CUBO CXT32090 *ELEVADOR*",
            "valor": 259.61,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "FUSO CB01432227 *ELEVADOR*",
            "valor": 120.51,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL PRESSAO M70619 *ELEVADOR*",
            "valor": 7.14,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL PRESSAO L1188N *ELEVADOR*",
            "valor": 3.05,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "PISO CB11473169 038011 031414 *ELEVADOR*",
            "valor": 415.86,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CORRENTE ROLO CB01433201 CT-2 TC255 *ELEVADOR*",
            "valor": 4165.44,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "TABUA CB11464244 *ELEVADOR*",
            "valor": 1069.82,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "ELETRICA": {
        "total": 359.63,
        "itens": [
          {
            "desc": "AJUSTADOR AXT14491 *ELETRICA*",
            "valor": 295.8,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "FAROL OVAL LED 24W DNI 4165 *ELETRICA*",
            "valor": 63.83,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 59.69,
        "itens": [
          {
            "desc": "CONTRA PINO 0700014289 *EXT PRIMARIO*",
            "valor": 0.28,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "RESINA POLIMERO CXT22974 *EXT PRIMARIO*",
            "valor": 59.41,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "PICADOR": {
        "total": 28.67,
        "itens": [
          {
            "desc": "TIRA CB01473209 *PICADOR*",
            "valor": 28.67,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "CORTE BASE": {
        "total": 59.9,
        "itens": [
          {
            "desc": "JUNTA CB01436944 *CORTE BASE*",
            "valor": 59.9,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 363.03000000000003,
        "itens": [
          {
            "desc": "CONEXAO 1AA4FJ4 *HIDRAULICA*",
            "valor": 19.24,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA4FJB4 *HIDRAULICA*",
            "valor": 27.26,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA6FJ4 *HIDRAULICA*",
            "valor": 13.47,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA6FJA4 *HIDRAULICA*",
            "valor": 29.68,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA6FJA6 *HIDRAULICA*",
            "valor": 30.98,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA6FJB4 *HIDRAULICA*",
            "valor": 33.47,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA6FJB6 *HIDRAULICA*",
            "valor": 28.56,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA6FJC4 *HIDRAULICA*",
            "valor": 38.46,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA6FJC6 *HIDRAULICA*",
            "valor": 35.42,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO C.90 LONGA TTC FG 7/1 *HIDRAULICA*",
            "valor": 70.47,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETO 1AA6FJ6 *HIDRAULICA*",
            "valor": 15.41,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETO 9/16-18 1AA6MJ6 *HIDRAULICA*",
            "valor": 20.61,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62515": {
      "EXT PRIMARIO": {
        "total": 567,
        "itens": [
          {
            "desc": "SERV MANUT CAPO *EXT PRIMARIO*",
            "valor": 567,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MEC DEDICADO": {
        "total": 379.48,
        "itens": [
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 379.48,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "RODANTE": {
        "total": 694.24,
        "itens": [
          {
            "desc": "CILINDRO CXT17433 *RODANTE*",
            "valor": 694.24,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      }
    },
    "62516": {
      "ELEVADOR": {
        "total": 2023.08,
        "itens": [
          {
            "desc": "ARRUELA ENCOSTO CXT33040 *ELEVADOR*",
            "valor": 20.99,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA ENCOSTO CXT33040 *ELEVADOR*",
            "valor": 20.99,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA CXT33100 *ELEVADOR*",
            "valor": 199.38,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA CXT33567 *ELEVADOR*",
            "valor": 42.23,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PINO CXT33039 *ELEVADOR*",
            "valor": 67.25,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL PRESSAO 40M7048 *ELEVADOR*",
            "valor": 4.21,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA 0110005999 *ELEVADOR*",
            "valor": 10.18,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA T253342 *ELEVADOR*",
            "valor": 58.03,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PINO CXT33042 *ELEVADOR*",
            "valor": 510.7,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CABO CB01467761 CXT34560 *ELEVADOR*",
            "valor": 260.05,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CABO SEGURANCA CB01471989 CXT32793 *ELEVADOR*",
            "valor": 137.01,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "BUCHA CB01432234 *ELEVADOR*",
            "valor": 17.36,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ESPACADOR  CB01432051 *ELEVADOR*",
            "valor": 38.28,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "GUIA CB01471119 *ELEVADOR*",
            "valor": 25.76,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "PINO CB01487625 *ELEVADOR*",
            "valor": 88.56,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "POLIA CENTRAL CB01437522 031448 *ELEVADOR*",
            "valor": 522.1,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "PICADOR": {
        "total": 3791.67,
        "itens": [
          {
            "desc": "BUCHA 0261305008 *PICADOR*",
            "valor": 39.21,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA 0151340059 *PICADOR*",
            "valor": 52.68,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ROLAMENTO CB01419254 *PICADOR*",
            "valor": 409.6,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL AXT12969 *PICADOR*",
            "valor": 278.27,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "CHAPA PROTECAO 049885 *PICADOR*",
            "valor": 987.15,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL H64810 *PICADOR*",
            "valor": 1.64,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL T107889 *PICADOR*",
            "valor": 2.23,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CXT23507 CXT12341 *PICADOR*",
            "valor": 22.53,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL T80123 *PICADOR*",
            "valor": 46.74,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ROLAMENTO DE31280 *PICADOR*",
            "valor": 1056.59,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "VEDACAO CB01466740 CB01465465 *PICADOR*",
            "valor": 895.03,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 487.17999999999995,
        "itens": [
          {
            "desc": "CONEXAO 90 1BA16FRB16 *HIDRAULICA*",
            "valor": 219.07,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO 1AA8FJ8 *HIDRAULICA*",
            "valor": 21.84,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA8FJA8 *HIDRAULICA*",
            "valor": 37.38,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA8FJB6 *HIDRAULICA*",
            "valor": 40.58,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA8FJB8 *HIDRAULICA*",
            "valor": 37.23,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA8FJA6 *HIDRAULICA*",
            "valor": 45.28,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA8FJC6 *HIDRAULICA*",
            "valor": 67.96,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO RETO 1AA8FJ6 *HIDRAULICA*",
            "valor": 17.84,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "CABINE": {
        "total": 16.49,
        "itens": [
          {
            "desc": "PORCA SEGURANCA K40018 *CABINE*",
            "valor": 16.49,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62517": {
      "HIDRAULICA": {
        "total": 2035,
        "itens": [
          {
            "desc": "SERV MANUT CILINDRO *HIDRAULICA*",
            "valor": 2035,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62518": {
      "RODANTE": {
        "total": 3650.82,
        "itens": [
          {
            "desc": "SERV MANUT ESTEIRA *RODANTE*",
            "valor": 3645,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO SEXT ACO 8.8 12MM X 70MM MA RP *RODANTE*",
            "valor": 5.82,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MEC DEDICADO": {
        "total": 220.5,
        "itens": [
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 220.5,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      }
    },
    "62519": {
      "RODANTE": {
        "total": 1287.01,
        "itens": [
          {
            "desc": "SERV MANUT MOLA TENSORA *RODANTE*",
            "valor": 1166.4,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA CB01490885 *RODANTE*",
            "valor": 79.01,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO CXT20658 *RODANTE*",
            "valor": 20.8,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PARAFUSO CXT35314 *RODANTE*",
            "valor": 20.8,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "ROLO ALIMENTACAO": {
        "total": 2222.9300000000003,
        "itens": [
          {
            "desc": "PEDESTAL AXT13199 AXT18308 *ROLO ALIMENTACAO*",
            "valor": 758.6,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA 0111378973 *ROLO ALIMENTACAO*",
            "valor": 37.01,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ROLETE AXT15581 CB11455267 *ROLO ALIMENTACAO*",
            "valor": 685.48,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ROLO AXT11590 *ROLO ALIMENTACAO*",
            "valor": 741.84,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "ELEVADOR": {
        "total": 8600.289999999999,
        "itens": [
          {
            "desc": "ARRUELA ENCOSTO CXT33040 *ELEVADOR*",
            "valor": 20.99,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA T253342 *ELEVADOR*",
            "valor": 29.01,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA CXT33100 *ELEVADOR*",
            "valor": 199.38,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "BUCHA CXT33567 *ELEVADOR*",
            "valor": 42.23,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL DESGASTE CB01452630 *ELEVADOR*",
            "valor": 610.36,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL DESGASTE CB01452630 *ELEVADOR*",
            "valor": -305.18,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "CABO CB01467761 CXT34560 *ELEVADOR*",
            "valor": 260.05,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CABO SEGURANCA CB01471989 CXT32793 *ELEVADOR*",
            "valor": 137.01,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "BUCHA CB01432234 *ELEVADOR*",
            "valor": 17.36,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "GUIA CB01471119 *ELEVADOR*",
            "valor": 25.76,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "POLIA CENTRAL CB01437522 031448 *ELEVADOR*",
            "valor": 522.1,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA ENCOSTO CXT33040 *ELEVADOR*",
            "valor": 41.98,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA T253342 *ELEVADOR*",
            "valor": 29.01,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL PRESSAO 40M7048 *ELEVADOR*",
            "valor": 8.41,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ANEL PRESSAO U12167 *ELEVADOR*",
            "valor": 4.8,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "PARAFUSO FENDA 22M7134 *ELEVADOR*",
            "valor": 23.71,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "PINO MESA GIRO CXT33037 *ELEVADOR*",
            "valor": 34.08,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "PISO CB11473169 038011 031414 *ELEVADOR*",
            "valor": 415.86,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CORRENTE ROLO CB01433201 CT-2 TC255 *ELEVADOR*",
            "valor": 4165.44,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "TABUA CB11464244 *ELEVADOR*",
            "valor": 2317.93,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "ROLO PRE TOMBADOR": {
        "total": 25.87,
        "itens": [
          {
            "desc": "PARAFUSO 19M7794 M16 X 50MM *ROLO PRE TOMBADOR*",
            "valor": 25.87,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "EXT PRIMARIO": {
        "total": 125.67,
        "itens": [
          {
            "desc": "ANEL TRAVAMENTO CXT16363 CXT38637 *EXT PRIMARIO*",
            "valor": 39.57,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ARRUELA 24H1536 *EXT PRIMARIO*",
            "valor": 1.93,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PLACA DESGASTE CXT22425 *EXT PRIMARIO*",
            "valor": 56.67,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO T56112 *EXT PRIMARIO*",
            "valor": 13.35,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "PORCA E12379 *EXT PRIMARIO*",
            "valor": 14.15,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "ELETRICA": {
        "total": 3.17,
        "itens": [
          {
            "desc": "PORCA SEGURANCA 14M7401 *ELETRICA*",
            "valor": 3.17,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MOTOR": {
        "total": 1.79,
        "itens": [
          {
            "desc": "ARRUELA PRESSAO 12H301 *MOTOR*",
            "valor": 1.79,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "PICADOR": {
        "total": 15.87,
        "itens": [
          {
            "desc": "PARAFUSO 19M7791 *PICADOR*",
            "valor": 15.87,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "HIDRAULICA": {
        "total": 772.9100000000001,
        "itens": [
          {
            "desc": "MANGUEIRA CB11475042 *HIDRAULICA*",
            "valor": 93.29,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA HIDRAULICA CB11475038 *HIDRAULICA*",
            "valor": 134.09,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA HIDRAULICA CB11475039 *HIDRAULICA*",
            "valor": 63.18,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA HIDRAULICA CB11475040 *HIDRAULICA*",
            "valor": 50.04,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "MANGUEIRA HIDRAULICA CB11475041 *HIDRAULICA*",
            "valor": 79.34,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "ANEL PRESSAO 40M7068 *HIDRAULICA*",
            "valor": 9.05,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 1AA12FJ12 *HIDRAULICA*",
            "valor": 39.32,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 45 1AA12FJA12 *HIDRAULICA*",
            "valor": 64.07,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA12FJB12 *HIDRAULICA*",
            "valor": 58.74,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO 90 1AA12FJC12 *HIDRAULICA*",
            "valor": 60.76,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO FG 1.1/16POL 1AA12FJA10 *HIDRAULICA*",
            "valor": 72.49,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "CONEXAO PRENSAVEL RETA FG 1.1/16POL *HIDRAULICA*",
            "valor": 48.54,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "CABINE": {
        "total": 19.43,
        "itens": [
          {
            "desc": "PORCA SEGURANCA K40018 *CABINE*",
            "valor": 16.49,
            "data": "2026-01-06",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          },
          {
            "desc": "ARRUELA 24M7053 *CABINE*",
            "valor": 2.94,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      },
      "PNEU": {
        "total": 89.54,
        "itens": [
          {
            "desc": "ARRUELA T151797 *PNEU*",
            "valor": 89.54,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "SIM"
          }
        ]
      }
    },
    "62522": {
      "HIDRAULICA": {
        "total": 1145.04,
        "itens": [
          {
            "desc": "SERV MANUT CILINDRO *HIDRAULICA*",
            "valor": 980,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "CONEXAO RETA 1BA16FR16 4SA16FR16 *HIDRAULICA*",
            "valor": 165.04,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "PICADOR": {
        "total": 377.57,
        "itens": [
          {
            "desc": "LAMINA PICADORA 95MM X 910MM CXT12136 *PICADOR*",
            "valor": 377.57,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "CORTE BASE": {
        "total": 41.33,
        "itens": [
          {
            "desc": "ARRUELA T83426 *CORTE BASE*",
            "valor": 41.33,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "DIVISOR LINHA": {
        "total": 181.16,
        "itens": [
          {
            "desc": "BICO DIVISOR C.JD 050 *DIVISOR LINHA*",
            "valor": 181.16,
            "data": "2026-01-07",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      }
    },
    "62523": {
      "RODANTE": {
        "total": 2566.8,
        "itens": [
          {
            "desc": "SERV MANUT ACIONAMENTO-CUBO REDUTOR *RODANTE*",
            "valor": 1384.2,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "SERV MANUT ESTEIRA *RODANTE*",
            "valor": 1182.6,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "MEC DEDICADO": {
        "total": 465.75,
        "itens": [
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 336.6,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          },
          {
            "desc": "SERV KM RODADO *MEC DEDICADO*",
            "valor": 129.15,
            "data": "2026-01-02",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      },
      "ELETRICA": {
        "total": 17.79,
        "itens": [
          {
            "desc": "FITA ISOLANTE TECIDO 19MM X 25M *ELETRICA*",
            "valor": 17.79,
            "data": "2026-01-05",
            "empresa": "CRV-MG",
            "reforma": "NAO"
          }
        ]
      }
    }
  }
};

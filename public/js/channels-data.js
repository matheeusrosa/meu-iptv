/**
 * IPTV Pro Brasil - Grade Curada Completa (75 Canais)
 */
const DEFAULT_CHANNELS_DATA = [
  {
    "name": "Rede Globo HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=Rede%20Globo%20canal%20tv%20logo%20png%20transparent",
    "url": "https://media2.cdntvms.com.br/tv_morena_dorados/tracks-v1a1/mono.m3u8",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/296748.m3u8"
  },
  {
    "name": "Rede Globo São Paulo HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=Rede%20Globo%20Sao%20Paulo%20canal%20tv%20logo%20png%20transparent",
    "url": "http://up.kiwi/live/351921603109/34939156/296729.m3u8",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/296748.m3u8"
  },
  {
    "name": "Rede Globo Pará (TV Liberal Belém) HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20Liberal%20Rede%20Globo%20Para%20logo%20png%20transparent",
    "url": "http://up.kiwi/live/351921603109/34939156/296819.m3u8",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/296818.m3u8"
  },
  {
    "name": "Rede Globo SP (EPTV Campinas) HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=EPTV%20Campinas%20Globo%20logo%20png%20transparent",
    "url": "http://up.kiwi/live/351921603109/34939156/296700.m3u8",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/296729.m3u8"
  },
  {
    "name": "Rede Globo SP (TV Tribuna Santos) HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20Tribuna%20Santos%20Globo%20logo%20png%20transparent",
    "url": "http://up.kiwi/live/351921603109/34939156/296748.m3u8",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/296729.m3u8"
  },
  {
    "name": "Rede Globo SP (TV Vanguarda) HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20Vanguarda%20Globo%20logo%20png%20transparent",
    "url": "http://up.kiwi/live/351921603109/34939156/296775.m3u8",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/296729.m3u8"
  },
  {
    "name": "TV Paraense HD (Castanhal - Pará)",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20Paraense%20canal%20tv%20logo%20png%20transparent",
    "url": "https://video09.logicahost.com.br/tvparaense/tvparaense/playlist.m3u",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/296818.m3u8"
  },
  {
    "name": "SBT Nacional HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=SBT%20Nacional%20canal%20tv%20logo%20png%20transparent",
    "url": "http://up.kiwi/live/351921603109/34939156/296862.m3u8",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/296880.m3u8"
  },
  {
    "name": "Record TV HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=Record%20TV%20canal%20tv%20logo%20png%20transparent",
    "url": "https://media.cdntvms.com.br/record_nacional_sat/index.m3u8",
    "backupUrl": "https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8"
  },
  {
    "name": "Band TV HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=Band%20TV%20canal%20tv%20logo%20png%20transparent",
    "url": "https://media.cdntvms.com.br/band_sat/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "TV Cultura HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20Cultura%20canal%20tv%20logo%20png%20transparent",
    "url": "https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8",
    "backupUrl": "http://45.162.64.114/TV_CULTURA/index.m3u8"
  },
  {
    "name": "RedeTV! HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=RedeTV%21%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/REDE_TV/index.m3u8",
    "backupUrl": "https://tv01.zas.media:1936/redetvparana/redetvparana/playlist.m3u8"
  },
  {
    "name": "TV Gazeta HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20Gazeta%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/GAZETA/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "TV Brasil HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20Brasil%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/TV_BRASIL/index.m3u8",
    "backupUrl": "http://45.177.114.115/TV_BRASIL_2/index.m3u8"
  },
  {
    "name": "TV Senado HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20Senado%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/TV_SENADO/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "TV Câmara Federal HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=TV%20C%C3%A2mara%20Federal%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/TV_CAMARA/index.m3u8",
    "backupUrl": "https://stream3.camara.gov.br/tv1/manifest.m3u8"
  },
  {
    "name": "Canal Gov HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=Canal%20Gov%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.115/TV_BRASIL_2/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Canal Educação HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=Canal%20Educa%C3%A7%C3%A3o%20canal%20tv%20logo%20png%20transparent",
    "url": "https://canaleducacao-stream.ebc.com.br/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Rede Brasil HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=Rede%20Brasil%20canal%20tv%20logo%20png%20transparent",
    "url": "http://up.kiwi/live/351921603109/34939156/1112.m3u8",
    "backupUrl": "https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8"
  },
  {
    "name": "History Channel HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=History%20Channel%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/HISTORY/tracks-v3a1/mono.m3u8",
    "backupUrl": "http://45.162.64.114/HISTORY/index.m3u8"
  },
  {
    "name": "History 2 (H2) HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=History%202%20%28H2%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/HISTORY_2/tracks-v3a1/mono.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Discovery Channel HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=Discovery%20Channel%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/DISCOVERY_CHANNEL/tracks-v3a1/mono.m3u8",
    "backupUrl": "http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8"
  },
  {
    "name": "Discovery Turbo HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=Discovery%20Turbo%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/DISCOVERY_TURBO/tracks-v3a1/mono.m3u8",
    "backupUrl": "https://jmp2.uk/plu-6014761dfb91870008ea6463.m3u8"
  },
  {
    "name": "Discovery Kids HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=Discovery%20Kids%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/DISCOVERY_KIDS/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Discovery Science HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=Discovery%20Science%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/DISCOVERY_SCIENCE/tracks-v3a1/mono.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Discovery World HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=Discovery%20World%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/DISCOVERY_WORLD/tracks-v3a1/mono.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Discovery Theater HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=Discovery%20Theater%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/DISCOVERY_THEATER/tracks-v3a1/mono.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Animal Planet HD",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=Animal%20Planet%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.114/ANIMAL_PLANET/tracks-v3a1/mono.m3u8",
    "backupUrl": ""
  },
  {
    "name": "NASA TV HD (Ciência e Espaço)",
    "group": "History & Discovery",
    "category": "History & Discovery",
    "logo": "https://tse2.mm.bing.net/th?q=NASA%20TV%20%28Ci%C3%AAncia%20e%20Espa%C3%A7o%29%20canal%20tv%20logo%20png%20transparent",
    "url": "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
    "backupUrl": "https://jmp2.uk/plu-5d8d21b4da5ff5001a1dbd04.m3u8"
  },
  {
    "name": "ge Fast (Globo Esporte 1080p) HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=ge%20Fast%20%28Globo%20Esporte%201080p%29%20canal%20tv%20logo%20png%20transparent",
    "url": "https://amg00716-globo-amg00716c1-tcl-br-9495.playouts.now.amagi.tv/playlist.m3u8",
    "backupUrl": ""
  },
  {
    "name": "SporTV HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=SporTV%20canal%20tv%20logo%20png%20transparent",
    "url": "http://181.78.197.59:8000/play/a078/index.m3u8",
    "backupUrl": "https://amg00716-globo-amg00716c1-tcl-br-9495.playouts.now.amagi.tv/playlist.m3u8"
  },
  {
    "name": "SporTV 2 HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=SporTV%202%20canal%20tv%20logo%20png%20transparent",
    "url": "http://181.78.197.59:8000/play/a079/index.m3u8",
    "backupUrl": "http://170.83.49.66:8083/SPORTV3HD/index.m3u8"
  },
  {
    "name": "SporTV 3 HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=SporTV%203%20canal%20tv%20logo%20png%20transparent",
    "url": "http://181.78.197.59:8000/play/a080/index.m3u8",
    "backupUrl": "http://170.83.49.66:8083/SPORTV3HD/index.m3u8"
  },
  {
    "name": "ESPN Brasil HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=ESPN%20Brasil%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/ESPN_BRASIL/index.m3u8",
    "backupUrl": "http://181.78.197.59:8000/play/a081/index.m3u8"
  },
  {
    "name": "ESPN 3 HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=ESPN%203%20canal%20tv%20logo%20png%20transparent",
    "url": "http://181.78.197.59:8000/play/a081/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Fox Sports / ESPN 4 HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=Fox%20Sports%20/%20ESPN%204%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/ESPN_4/index.m3u8",
    "backupUrl": "http://45.177.114.115/ESPN_4/index.m3u8"
  },
  {
    "name": "Premiere Clubes HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=Premiere%20Clubes%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-6806d62369aec5b19cd628c0.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Combate HD / MMA TV",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=Combate%20/%20MMA%20TV%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-5f32d2db0af67400077f29c4.m3u8",
    "backupUrl": ""
  },
  {
    "name": "FIFA+ HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=FIFA%2B%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-66997e8d3a4ad20008e50be9.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Red Bull TV HD",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=Red%20Bull%20TV%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-67813f3162bf016db944c9ab.m3u8",
    "backupUrl": ""
  },
  {
    "name": "WooHoo (Esportes Radicais)",
    "group": "Canais Globo & Esportes",
    "category": "Canais Globo & Esportes",
    "logo": "https://tse2.mm.bing.net/th?q=WooHoo%20%28Esportes%20Radicais%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/WOOHOO/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Megapix HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Megapix%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-61b790b985706b00072cb797.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Telecine Premium HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Telecine%20Premium%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-5f120e94a5714d00074576a1.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Telecine Action HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Telecine%20Action%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-5f120f41b7d403000783a6d6.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Telecine Pipoca HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Telecine%20Pipoca%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-62545ed3dab4380007582f7c.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Telecine Touch HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Telecine%20Touch%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-5f171f988ab9780007fa95ea.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Telecine Fun HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Telecine%20Fun%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-5f12101f0b12f00007844c7c.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Telecine Cult HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Telecine%20Cult%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-5fa1612a669ba0000702017b.m3u8",
    "backupUrl": ""
  },
  {
    "name": "TNT HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=TNT%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/TNT/index.m3u8",
    "backupUrl": "http://45.177.114.114/TNT/tracks-v3a1/mono.m3u8"
  },
  {
    "name": "Space HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Space%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/SPACE/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Sony Movies HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Sony%20Movies%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/SONY_MOVIES/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Adrenalina Pura HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://images.pluto.tv/channels/61b790b985706b00072cb797/colorLogoPNG.png",
    "url": "https://jmp2.uk/plu-61b790b985706b00072cb797.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Canal Fox HD (Os Simpsons)",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Canal%20Fox%20%28Os%20Simpsons%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://138.121.15.230:9002/STAR-CHANNEL/tracks-v1a1/mono.m3u8",
    "backupUrl": "http://138.121.15.230:9002/FX/tracks-v1a1/mono.m3u8"
  },
  {
    "name": "FX HD (Fox FX)",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=FX%20%28Fox%20FX%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://138.121.15.230:9002/FX/tracks-v1a1/mono.m3u8",
    "backupUrl": "http://138.121.15.230:9002/STAR-CHANNEL/tracks-v1a1/mono.m3u8"
  },
  {
    "name": "Cinecanal HD (Fox Life)",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Cinecanal%20%28Fox%20Life%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://138.121.15.230:9002/CINECANAL/index.m3u8",
    "backupUrl": "https://jmp2.uk/plu-61b790b985706b00072cb797.m3u8"
  },
  {
    "name": "Warner Channel HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Warner%20Channel%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.177.114.115/WARNER_CHANNEL/index.m3u8",
    "backupUrl": "http://45.162.64.114/WARNER_CHANNEL/index.m3u8"
  },
  {
    "name": "Sony Channel HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Sony%20Channel%20canal%20tv%20logo%20png%20transparent",
    "url": "http://138.121.15.230:9002/SONY/index.m3u8",
    "backupUrl": "http://170.83.16.50/SONY_CHANNEL/index.m3u8"
  },
  {
    "name": "AXN HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=AXN%20canal%20tv%20logo%20png%20transparent",
    "url": "http://138.121.15.230:9002/AXN/index.m3u8",
    "backupUrl": "http://170.83.16.50/AXN/index.m3u8"
  },
  {
    "name": "Universal TV HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://tse2.mm.bing.net/th?q=Universal%20TV%20canal%20tv%20logo%20png%20transparent",
    "url": "http://138.121.15.230:9002/UNIVERSAL-CHANNEL/index.m3u8",
    "backupUrl": "http://187.102.210.46/universo/index.m3u8"
  },
  {
    "name": "Cine Sucessos HD",
    "group": "Filmes & Cinema",
    "category": "Filmes & Cinema",
    "logo": "https://images.pluto.tv/channels/5f120e94a5714d00074576a1/colorLogoPNG.png",
    "url": "https://jmp2.uk/plu-5f120e94a5714d00074576a1.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Canal Futura (Globo / FRM)",
    "group": "Globosat & Variedades",
    "category": "Globosat & Variedades",
    "logo": "https://tse2.mm.bing.net/th?q=Canal%20Futura%20%28Globo%20/%20FRM%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/FUTURA/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "GloboNews Ao Vivo HD",
    "group": "Globosat & Variedades",
    "category": "Globosat & Variedades",
    "logo": "https://tse2.mm.bing.net/th?q=GloboNews%20canal%20tv%20logo%20png%20transparent",
    "url": "http://up.kiwi/live/351921603109/34939156/296342.m3u8",
    "backupUrl": "http://up.kiwi/live/351921603109/34939156/299672.m3u8"
  },
  {
    "name": "Multishow HD",
    "group": "Globosat & Variedades",
    "category": "Globosat & Variedades",
    "logo": "https://tse2.mm.bing.net/th?q=Multishow%20canal%20tv%20logo%20png%20transparent",
    "url": "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01131-tracetv-tracebrazuca-samsungbr/playlist.m3u8",
    "backupUrl": ""
  },
  {
    "name": "GNT HD / Gastronomia",
    "group": "Globosat & Variedades",
    "category": "Globosat & Variedades",
    "logo": "https://tse2.mm.bing.net/th?q=GNT%20/%20Gastronomia%20canal%20tv%20logo%20png%20transparent",
    "url": "https://jmp2.uk/plu-5fd1419a3b4f4b000773ba85.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Viva HD (Novelas & Clássicos)",
    "group": "Globosat & Variedades",
    "category": "Globosat & Variedades",
    "logo": "https://tse2.mm.bing.net/th?q=Viva%20%28Novelas%20%26%20Cl%C3%A1ssicos%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/TNT_NOVELAS/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "TNT Novelas HD",
    "group": "Globosat & Variedades",
    "category": "Globosat & Variedades",
    "logo": "https://tse2.mm.bing.net/th?q=TNT%20Novelas%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/TNT_NOVELAS/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Cartoon Network HD",
    "group": "Infantil & Cultura",
    "category": "Infantil & Cultura",
    "logo": "https://tse2.mm.bing.net/th?q=Cartoon%20Network%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/CARTOON_NETWORK/index.m3u8",
    "backupUrl": "http://170.83.16.50/CARTOON/index.m3u8"
  },
  {
    "name": "Turma da Mônica HD",
    "group": "Infantil & Cultura",
    "category": "Infantil & Cultura",
    "logo": "https://images.pluto.tv/channels/5f997e44949bc70007a6941e/colorLogoPNG.png",
    "url": "https://jmp2.uk/plu-5f997e44949bc70007a6941e.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Bob Esponja Calça Quadrada HD",
    "group": "Infantil & Cultura",
    "category": "Infantil & Cultura",
    "logo": "https://images.pluto.tv/channels/62545c0b002f4b0007688b61/colorLogoPNG.png",
    "url": "https://jmp2.uk/plu-62545c0b002f4b0007688b61.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Boomerang / Cartoonito HD",
    "group": "Infantil & Cultura",
    "category": "Infantil & Cultura",
    "logo": "https://tse2.mm.bing.net/th?q=Boomerang%20/%20Cartoonito%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/BOOMERANG/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "ZooMoo Kids HD",
    "group": "Infantil & Cultura",
    "category": "Infantil & Cultura",
    "logo": "https://tse2.mm.bing.net/th?q=ZooMoo%20Kids%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/ZOOMOO_KIDS/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "BabyFirst Kids Brasil",
    "group": "Infantil & Cultura",
    "category": "Infantil & Cultura",
    "logo": "https://images.pluto.tv/channels/5f4fb4cf605ddf000748e16f/colorLogoPNG.png",
    "url": "https://jmp2.uk/plu-5f4fb4cf605ddf000748e16f.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Arte 1 (Cinema & Cultura)",
    "group": "Infantil & Cultura",
    "category": "Infantil & Cultura",
    "logo": "https://tse2.mm.bing.net/th?q=Arte%201%20%28Cinema%20%26%20Cultura%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/ARTE1/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Play TV (Games & Cultura Pop)",
    "group": "Infantil & Cultura",
    "category": "Infantil & Cultura",
    "logo": "https://tse2.mm.bing.net/th?q=Play%20TV%20%28Games%20%26%20Cultura%20Pop%29%20canal%20tv%20logo%20png%20transparent",
    "url": "http://45.162.64.114/PLAY_TV/index.m3u8",
    "backupUrl": ""
  },
  {
    "name": "Record News HD",
    "group": "TV Aberta & Nacionais",
    "category": "TV Aberta & Nacionais",
    "logo": "https://tse2.mm.bing.net/th?q=Record%20News%20canal%20tv%20logo%20png%20transparent",
    "url": "https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8",
    "backupUrl": ""
  }
];

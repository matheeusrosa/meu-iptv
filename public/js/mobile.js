/**
 * IPTV Pro Mobile - Motor do Reprodutor e Interface Touch
 * 
 * Recursos Principais:
 * - Roteamento 100% via Proxy Anti-CORS e Anti-Bloqueio
 * - Suporte Híbrido Universal: HLS.js (Android/Chrome) & HLS Nativo (iOS/Safari)
 * - Wake Lock API (Impede que a tela do celular apague)
 * - Tratamento de Autoplay e Desbloqueio de Áudio com 1 toque
 * - Filtros rápidos, Favoritos e Pesquisa instantânea
 */

(function () {
  'use strict';

  // Estado da Aplicação
  let channels = [];
  let filteredChannels = [];
  let currentChannelIndex = 0;
  let currentCategory = 'Todos';
  let favorites = new Set();
  let hls = null;
  let isUsingBackup = false;
  let wakeLock = null;
  let controlsHideTimeout = null;

  // Carrega favoritos do LocalStorage
  try {
    const saved = localStorage.getItem('iptv_mobile_favorites');
    if (saved) favorites = new Set(JSON.parse(saved));
  } catch (e) {}

  // Elementos DOM
  const dom = {
    video: document.getElementById('mobile-video'),
    statusOverlay: document.getElementById('player-status-overlay'),
    statusText: document.getElementById('status-text'),
    unmuteBanner: document.getElementById('unmute-banner'),
    controlsOverlay: document.getElementById('video-controls-overlay'),
    
    // Controles Vídeo
    btnPlayPause: document.getElementById('btn-play-pause'),
    iconPlay: document.getElementById('icon-play'),
    iconPause: document.getElementById('icon-pause'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    btnFullscreenStrip: document.getElementById('btn-fullscreen-strip'),
    btnPip: document.getElementById('btn-pip'),
    btnReload: document.getElementById('btn-reload'),
    btnAspect: document.getElementById('btn-aspect'),
    
    // Informações do Canal
    quickLogo: document.getElementById('channel-quick-logo'),
    quickName: document.getElementById('channel-quick-name'),
    quickCategory: document.getElementById('channel-quick-category'),
    stripLogo: document.getElementById('strip-logo'),
    stripFallback: document.getElementById('strip-fallback'),
    stripName: document.getElementById('strip-name'),
    stripCategory: document.getElementById('strip-category'),
    btnFav: document.getElementById('btn-fav'),
    
    // Listagem e Pesquisa
    searchInput: document.getElementById('search-input'),
    searchClear: document.getElementById('search-clear'),
    categoriesScroll: document.getElementById('categories-scroll'),
    channelGrid: document.getElementById('channel-grid'),
    channelsCountBadge: document.getElementById('channels-count-badge')
  };

  // --- MOTOR DE TRANSMISSÃO E REPRODUÇÃO (ANTI-BLOQUEIO) ---

  // Obtém URL inteligente:
  // Se for HTTP e a página for HTTPS -> Roteia pelo Proxy para evitar Mixed Content
  // Se for domínio com restrição conhecida de CORS -> Roteia pelo Proxy
  // Caso contrário -> Tenta direto primeiro para máxima velocidade e performance
  function getSafeStreamUrl(rawUrl, forceProxy = false) {
    if (!rawUrl) return '';
    const isPageHttps = window.location.protocol === 'https:';
    const isUrlHttp = rawUrl.startsWith('http:');
    const lower = rawUrl.toLowerCase();
    const needsProxy = forceProxy || (isPageHttps && isUrlHttp) ||
                       lower.includes('jmp2.uk') || lower.includes('pluto.tv') || lower.includes('stitcher') || lower.includes('up.kiwi');

    if (needsProxy && window.location.protocol.startsWith('http')) {
      return `/proxy?url=${encodeURIComponent(rawUrl)}`;
    }
    return rawUrl;
  }

  function showStatus(text) {
    dom.statusText.textContent = text;
    dom.statusOverlay.classList.add('active');
  }

  function hideStatus() {
    dom.statusOverlay.classList.remove('active');
  }

  // Ativa Wake Lock para manter a tela do celular sempre ligada
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      }
    } catch (e) {}
  }

  // Tenta desmutar com interação do usuário
  function handleUnmuteClick() {
    dom.video.muted = false;
    dom.unmuteBanner.classList.add('hidden');
  }

  // Permite desmutar no primeiro toque em qualquer parte da tela
  document.addEventListener('click', () => {
    if (dom.video && dom.video.muted && !dom.video.paused) {
      dom.video.muted = false;
      dom.unmuteBanner.classList.add('hidden');
    }
  }, { once: true });

  let isUsingProxy = false;

  function playChannel(index, useBackup = false, useProxy = false) {
    if (!filteredChannels.length) return;
    if (index < 0) index = filteredChannels.length - 1;
    if (index >= filteredChannels.length) index = 0;

    currentChannelIndex = index;
    isUsingBackup = useBackup;
    isUsingProxy = useProxy;
    const channel = filteredChannels[index];

    // Atualiza Informações Visuais
    updateChannelInfo(channel);

    const targetUrl = isUsingBackup ? (channel.backupUrl || channel.url) : channel.url;
    const safeUrl = getSafeStreamUrl(targetUrl, isUsingProxy);

    showStatus(isUsingBackup ? 'Sinal alternativo...' : (isUsingProxy ? 'Roteando via Proxy Seguro...' : `Sintonizando ${channel.name}...`));

    // Destrói instância HLS anterior de forma limpa e segura
    if (hls) {
      try {
        hls.stopLoad();
        hls.detachMedia();
        hls.destroy();
      } catch (e) {
        console.warn('[Mobile] Limpeza HLS:', e);
      }
      hls = null;
    }

    // Inicia muted para garantir que as políticas de autoplay do celular não bloqueiem o vídeo
    dom.video.muted = true;

    // Estratégia Híbrida:
    // 1. Android / Chrome / Desktop: Usa Hls.js com buffer ajustado para celular
    // 2. iPhone / Safari: Usa HLS Nativo da Apple (<video src="...">)
    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,          // Retém 1 minuto em RAM para retorno sem sobrecarregar o celular
        maxBufferLength: 90,           // Mantém até 90s de buffer pré-carregado à frente (estilo YouTube)
        maxMaxBufferLength: 180,
        maxBufferSize: 100 * 1000 * 1000,
        highBufferWatchdogPeriod: 1,   // Monitora e preenche o buffer a cada 1 segundo continuamente
        startLevel: -1,                // Auto ABR
        capLevelToPlayerSize: false,
        startFragPrefetch: true,       // Pré-carrega próximo fragmento sem micro-pausas
        progressive: false,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 8,
        levelLoadingTimeOut: 20000,
        fragLoadingTimeOut: 25000,
        fragLoadingMaxRetry: 10,
        liveSyncDurationCount: 3,      // Inicia a 3 segmentos da borda ao vivo
        liveMaxLatencyDuration: Infinity,      // Estilo YouTube: Mantém o atraso se a conexão cair 5s, sem pular ou retroceder
        liveMaxLatencyDurationCount: Infinity, // Sem avanço automático forçado
        maxLiveSyncPlaybackRate: 1.0,  // Velocidade SEMPRE 1.0x (sem acelerar áudio nem vídeo)
        liveDurationInfinity: true,
        nudgeMaxRetry: 0               // Sem saltos de timestamp artificiais
      });

      hls.loadSource(safeUrl);
      hls.attachMedia(dom.video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, (event, data) => {
        hideStatus();
        dom.video.play().then(() => {
          dom.unmuteBanner.classList.remove('hidden');
        }).catch(() => {
          dom.unmuteBanner.classList.remove('hidden');
        });
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        // Recuperação suave estilo YouTube: deixa o buffer encher naturalmente sem tocar em currentTime
        if (data.details === window.Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          if (hls) hls.startLoad();
          return;
        }

        if (data.details === window.Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
          return;
        }

        if (data.fatal) {
          console.warn('[HLS Mobile Error]', data.type, data.details);
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              if (!isUsingProxy) {
                // Tenta via Proxy local
                playChannel(currentChannelIndex, isUsingBackup, true);
              } else if (!isUsingBackup && channel.backupUrl) {
                // Tenta sinal reserva
                playChannel(currentChannelIndex, true, false);
              } else {
                showStatus('Canal indisponível no momento');
                setTimeout(hideStatus, 4000);
              }
              break;

            case window.Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;

            default:
              if (!isUsingBackup && channel.backupUrl) {
                playChannel(currentChannelIndex, true, false);
              } else {
                showStatus('Erro ao reproduzir canal');
                setTimeout(hideStatus, 4000);
              }
              break;
          }
        }
      });

    } else if (dom.video.canPlayType('application/vnd.apple.mpegurl')) {
      // Suporte Nativo Apple Safari (iOS / iPadOS)
      dom.video.src = safeUrl;
      
      const onCanPlay = () => {
        hideStatus();
        dom.video.play().then(() => {
          dom.unmuteBanner.classList.remove('hidden');
        }).catch(() => {
          dom.unmuteBanner.classList.remove('hidden');
        });
        dom.video.removeEventListener('canplay', onCanPlay);
      };
      dom.video.addEventListener('canplay', onCanPlay);

      dom.video.onerror = () => {
        if (!isUsingProxy) {
          playChannel(currentChannelIndex, isUsingBackup, true);
        } else if (!isUsingBackup && channel.backupUrl) {
          playChannel(currentChannelIndex, true, false);
        } else {
          showStatus('Canal indisponível no momento');
          setTimeout(hideStatus, 4000);
        }
      };
    }

    requestWakeLock();
    renderChannelGrid();
  }

  function updateChannelInfo(channel) {
    dom.quickName.textContent = channel.name;
    dom.quickCategory.textContent = channel.category || 'Ao Vivo';
    dom.stripName.textContent = channel.name;
    dom.stripCategory.textContent = channel.category || 'Ao Vivo';

    const isFav = favorites.has(channel.name);
    dom.btnFav.classList.toggle('active', isFav);

    // Logos
    if (channel.logo) {
      dom.quickLogo.src = channel.logo;
      dom.quickLogo.style.display = 'block';
      dom.stripLogo.src = channel.logo;
      dom.stripLogo.style.display = 'block';
      dom.stripFallback.style.display = 'none';

      dom.stripLogo.onerror = () => {
        dom.stripLogo.style.display = 'none';
        dom.stripFallback.style.display = 'flex';
        dom.stripFallback.textContent = channel.name.substring(0, 2).toUpperCase();
      };
    } else {
      dom.quickLogo.style.display = 'none';
      dom.stripLogo.style.display = 'none';
      dom.stripFallback.style.display = 'flex';
      dom.stripFallback.textContent = channel.name.substring(0, 2).toUpperCase();
    }
  }

  // --- CONTROLES DE TELA E INTERFACE ---

  function togglePlay() {
    if (dom.video.paused) {
      dom.video.play();
      dom.iconPlay.style.display = 'none';
      dom.iconPause.style.display = 'block';
    } else {
      dom.video.pause();
      dom.iconPlay.style.display = 'block';
      dom.iconPause.style.display = 'none';
    }
  }

  function toggleFullscreen() {
    const video = dom.video;
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      // iPhone / iPad (Safari usa exclusivamente webkitEnterFullscreen no elemento <video>)
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else if (video.requestFullscreen) {
        // Android / Chrome
        video.requestFullscreen().catch(() => {
          const wrapper = document.querySelector('.video-wrapper');
          if (wrapper && wrapper.requestFullscreen) wrapper.requestFullscreen();
        });
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      }
      
      // Tenta girar para paisagem automaticamente se a tela permitir
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (e) {}
    }
  }

  function togglePip() {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else if (dom.video.requestPictureInPicture) {
      dom.video.requestPictureInPicture().catch(() => {});
    }
  }

  let aspectModes = ['fit-contain', 'fit-cover', 'fit-fill'];
  let currentAspectIdx = 0;
  function cycleAspectRatio() {
    currentAspectIdx = (currentAspectIdx + 1) % aspectModes.length;
    dom.video.className = aspectModes[currentAspectIdx];
    const labels = ['Padrão (Contém)', 'Preencher Tela (Cover)', 'Esticar (Fill)'];
    showStatus(labels[currentAspectIdx]);
    setTimeout(hideStatus, 1500);
  }

  function toggleFavorite() {
    const current = filteredChannels[currentChannelIndex];
    if (!current) return;
    if (favorites.has(current.name)) {
      favorites.delete(current.name);
      dom.btnFav.classList.remove('active');
    } else {
      favorites.add(current.name);
      dom.btnFav.classList.add('active');
    }
    try {
      localStorage.setItem('iptv_mobile_favorites', JSON.stringify(Array.from(favorites)));
    } catch (e) {}
    renderChannelGrid();
  }

  // Oculta controles após inatividade
  function scheduleControlsHide() {
    clearTimeout(controlsHideTimeout);
    dom.controlsOverlay.classList.remove('auto-hidden');
    controlsHideTimeout = setTimeout(() => {
      if (!dom.video.paused) {
        dom.controlsOverlay.classList.add('auto-hidden');
      }
    }, 3500);
  }

  // --- FILTROS E RENDERIZAÇÃO DA GRADE ---

  function applyFilters() {
    const query = dom.searchInput.value.trim().toLowerCase();
    
    filteredChannels = channels.filter(c => {
      // Filtro de Categoria
      let matchesCategory = true;
      if (currentCategory === '⭐ Favoritos') {
        matchesCategory = favorites.has(c.name);
      } else if (currentCategory !== 'Todos') {
        matchesCategory = (c.category || c.group) === currentCategory;
      }

      // Filtro de Pesquisa
      let matchesSearch = true;
      if (query) {
        matchesSearch = c.name.toLowerCase().includes(query) ||
          (c.category && c.category.toLowerCase().includes(query));
      }

      return matchesCategory && matchesSearch;
    });

    dom.channelsCountBadge.textContent = `${filteredChannels.length} canais`;
    renderChannelGrid();
  }

  function renderCategories() {
    // Extrai categorias únicas
    const catSet = new Set(['Todos', '⭐ Favoritos']);
    channels.forEach(c => {
      if (c.category) catSet.add(c.category);
      else if (c.group) catSet.add(c.group);
    });

    dom.categoriesScroll.innerHTML = '';
    catSet.forEach(cat => {
      const chip = document.createElement('div');
      chip.className = `category-chip ${cat === currentCategory ? 'active' : ''}`;
      chip.textContent = cat;
      chip.addEventListener('click', () => {
        currentCategory = cat;
        document.querySelectorAll('.category-chip').forEach(el => el.classList.remove('active'));
        chip.classList.add('active');
        applyFilters();
      });
      dom.categoriesScroll.appendChild(chip);
    });
  }

  function renderChannelGrid() {
    dom.channelGrid.innerHTML = '';

    if (!filteredChannels.length) {
      dom.channelGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 32px 16px; color: var(--text-muted);">
          <p style="font-size: 15px; margin-bottom: 6px;">Nenhum canal encontrado</p>
          <p style="font-size: 12px;">Tente outra pesquisa ou categoria.</p>
        </div>
      `;
      return;
    }

    filteredChannels.forEach((channel, idx) => {
      const isCurrent = (idx === currentChannelIndex);
      const card = document.createElement('div');
      card.className = `channel-card ${isCurrent ? 'active' : ''}`;

      const logoBox = document.createElement('div');
      logoBox.className = 'channel-card-logo-box';

      if (channel.logo) {
        const img = document.createElement('img');
        img.src = channel.logo;
        img.alt = channel.name;
        img.loading = 'lazy';
        img.onerror = () => {
          img.style.display = 'none';
          logoBox.innerHTML = `<span style="font-size:14px; font-weight:700; color:var(--accent-primary);">${channel.name.substring(0, 2).toUpperCase()}</span>`;
        };
        logoBox.appendChild(img);
      } else {
        logoBox.innerHTML = `<span style="font-size:14px; font-weight:700; color:var(--accent-primary);">${channel.name.substring(0, 2).toUpperCase()}</span>`;
      }

      const nameEl = document.createElement('div');
      nameEl.className = 'channel-card-name';
      nameEl.textContent = channel.name;

      const catEl = document.createElement('div');
      catEl.className = 'channel-card-category';
      catEl.textContent = channel.category || 'Ao Vivo';

      const soundBars = document.createElement('div');
      soundBars.className = 'sound-bars';
      soundBars.innerHTML = '<div class="sound-bar"></div><div class="sound-bar"></div><div class="sound-bar"></div>';

      card.appendChild(logoBox);
      card.appendChild(nameEl);
      card.appendChild(catEl);
      card.appendChild(soundBars);

      card.addEventListener('click', () => {
        playChannel(idx);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      dom.channelGrid.appendChild(card);
    });
  }

  // --- INICIALIZAÇÃO ---
  async function init() {
    // 1. Carrega os canais (usa DEFAULT_CHANNELS_DATA se disponível, ou busca da API)
    if (window.DEFAULT_CHANNELS_DATA && window.DEFAULT_CHANNELS_DATA.length) {
      channels = window.DEFAULT_CHANNELS_DATA;
    } else {
      try {
        const res = await fetch('/api/channels');
        const data = await res.json();
        channels = data.channels || [];
      } catch (e) {
        channels = [];
      }
    }

    filteredChannels = [...channels];
    renderCategories();
    applyFilters();

    // 2. Eventos dos Controles
    dom.btnPlayPause.addEventListener('click', togglePlay);
    dom.btnPrev.addEventListener('click', () => playChannel(currentChannelIndex - 1));
    dom.btnNext.addEventListener('click', () => playChannel(currentChannelIndex + 1));
    dom.btnFullscreen.addEventListener('click', toggleFullscreen);
    if (dom.btnFullscreenStrip) {
      dom.btnFullscreenStrip.addEventListener('click', toggleFullscreen);
    }
    dom.btnPip.addEventListener('click', togglePip);
    dom.btnReload.addEventListener('click', () => playChannel(currentChannelIndex));
    dom.btnAspect.addEventListener('click', cycleAspectRatio);
    dom.btnFav.addEventListener('click', toggleFavorite);
    dom.unmuteBanner.addEventListener('click', handleUnmuteClick);

    // Eventos do Vídeo
    dom.video.addEventListener('play', () => {
      dom.iconPlay.style.display = 'none';
      dom.iconPause.style.display = 'block';
      scheduleControlsHide();
    });

    dom.video.addEventListener('pause', () => {
      dom.iconPlay.style.display = 'block';
      dom.iconPause.style.display = 'none';
      dom.controlsOverlay.classList.remove('auto-hidden');
    });

    // Toque no vídeo para exibir ou ocultar controles
    dom.controlsOverlay.addEventListener('click', (e) => {
      if (e.target === dom.controlsOverlay || e.target.closest('.controls-center-bar')) {
        scheduleControlsHide();
      }
    });

    // Duplo toque no vídeo para Tela Cheia instantânea
    let lastTapTime = 0;
    dom.controlsOverlay.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        e.preventDefault();
        toggleFullscreen();
      }
      lastTapTime = now;
    });

    // Pesquisa
    dom.searchInput.addEventListener('input', () => {
      dom.searchClear.classList.toggle('visible', dom.searchInput.value.length > 0);
      applyFilters();
    });

    dom.searchClear.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.searchClear.classList.remove('visible');
      applyFilters();
    });

    // 3. Sintoniza imediatamente o canal 0 (Rede Globo HD)
    if (filteredChannels.length > 0) {
      playChannel(0);
    }
  }

  // Inicia quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

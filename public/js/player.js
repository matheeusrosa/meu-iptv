/**
 * IPTV Pro Brasil - Player & HLS Engine com Telemetria e Proxy Inteligente
 * 
 * Funcionalidades:
 * - Reprodução HLS de baixa latência
 * - Roteamento inteligente de streams com restrição de CORS para o Proxy local (/proxy?url=)
 * - Telemetria automática de erros em tempo real (envia para /api/telemetry)
 * - Recuperação automática de falhas e fallback para stream reserva
 */

class StreamPlayer {
  constructor(videoElement, callbacks = {}) {
    this.video = videoElement;
    this.callbacks = Object.assign({
      onStatus: () => {},
      onError: () => {},
      onPlaying: () => {},
      onPlay: () => {},
      onPause: () => {},
      onVolumeChange: () => {},
      onTimeUpdate: () => {}
    }, callbacks);

    this.hls = null;
    this.currentChannel = null;
    this.currentUrl = null;
    this.currentBackupUrl = null;
    this.isUsingBackup = false;
    this.isUsingProxy = false;
    this.retryCount = 0;
    this.maxRetries = 2;
    this.stallTimer = null;

    this.initVideoEvents();
  }

  // Telemetria automática de erros para o backend
  reportTelemetry(type, details = {}) {
    const payload = {
      type: type,
      channel: this.currentChannel ? this.currentChannel.name : 'Desconhecido',
      streamUrl: this.currentUrl,
      isUsingProxy: this.isUsingProxy,
      isUsingBackup: this.isUsingBackup,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      details: details
    };

    console.warn(`[Telemetry Dispatch] ${type}:`, payload);

    const telemetryEndpoint = window.location.protocol.startsWith('http')
      ? '/api/telemetry'
      : 'http://localhost:3000/api/telemetry';

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(telemetryEndpoint, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      } else {
        fetch(telemetryEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    } catch (e) {}
  }

  initVideoEvents() {
    this.video.addEventListener('play', () => this.callbacks.onPlay());
    this.video.addEventListener('pause', () => this.callbacks.onPause());
    this.video.addEventListener('playing', () => {
      this.clearStallTimer();
      this.callbacks.onPlaying();
    });
    this.video.addEventListener('waiting', () => this.callbacks.onStatus('Bufferizando sinal...'));
    this.video.addEventListener('volumechange', () => this.callbacks.onVolumeChange(this.video.volume, this.video.muted));
    this.video.addEventListener('timeupdate', () => this.callbacks.onTimeUpdate(this.getDVRState()));
    this.video.addEventListener('progress', () => this.callbacks.onTimeUpdate(this.getDVRState()));
    this.video.addEventListener('error', () => {
      const err = this.video.error;
      this.reportTelemetry('VIDEO_TAG_ERROR', { code: err ? err.code : 'UNKNOWN', message: err ? err.message : '' });
      this.handlePlaybackFailure('Erro no elemento de vídeo nativo.');
    });
  }

  clearStallTimer() {
    if (this.stallTimer) {
      clearTimeout(this.stallTimer);
      this.stallTimer = null;
    }
  }

  startStallTimer() {
    this.clearStallTimer();
    // Tempo estendido de 20s para conexões lentas sem matar o fluxo prematuramente
    this.stallTimer = setTimeout(() => {
      if (this.video.paused && this.video.readyState === 0) {
        this.reportTelemetry('STREAM_STALL_TIMEOUT', {
          timeElapsedMs: 20000,
          readyState: this.video.readyState,
          paused: this.video.paused
        });
        this.handlePlaybackFailure('Sinal demorou para responder. Tentando rota alternativa...');
      }
    }, 20000);
  }

  // Verifica se a URL necessita do Proxy local por restrição de CORS conhecida
  shouldUseProxyByDefault(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('jmp2.uk') || lower.includes('pluto.tv') || lower.includes('stitcher') ||
           lower.includes('dai.google.com') || lower.includes('45.162.64.114') || lower.includes('170.83.') ||
           lower.includes('181.78.197.59') || lower.includes('138.121.') || lower.includes('45.177.') ||
           lower.includes('15.204.') || lower.includes('up.kiwi');
  }

  getResolvedPlayUrl(rawUrl) {
    // Se estiver rodando via servidor HTTP(S) e a URL exige proxy
    if (window.location.protocol.startsWith('http') && this.shouldUseProxyByDefault(rawUrl)) {
      this.isUsingProxy = true;
      return `/proxy?url=${encodeURIComponent(rawUrl)}`;
    }
    return rawUrl;
  }

  loadStream(channel) {
    this.currentChannel = channel;
    this.currentUrl = channel.url;
    this.currentBackupUrl = channel.backupUrl || '';
    this.isUsingBackup = false;
    this.isUsingProxy = false;
    this.retryCount = 0;

    const playUrl = this.getResolvedPlayUrl(channel.url);
    this.playSource(playUrl);
  }

  destroyHls() {
    this.clearStallTimer();
    if (this.hls) {
      try {
        this.hls.stopLoad();
        this.hls.detachMedia();
        this.hls.destroy();
      } catch (e) {
        console.warn('[Player] Aviso ao destruir Hls:', e);
      }
      this.hls = null;
    }
  }

  playSource(sourceUrl) {
    this.destroyHls();

    this.callbacks.onStatus(this.isUsingProxy ? 'Carregando via Proxy Seguro...' : 'Sintonizando canal...');
    this.startStallTimer();

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls(IPTV_CONFIG.hlsOptions);
      this.hls = hls;

      hls.loadSource(sourceUrl);
      hls.attachMedia(this.video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Blindagem contra instabilidade de sinal e travamento de resolução pesada
        if (data.levels && data.levels.length > 1) {
          // Se houver múltiplas qualidades, seleciona o perfil HD de alta estabilidade (entre 1.4 Mbps e 3.2 Mbps)
          // Isso evita que a transmissão salte para 5.4 Mbps em conexões com oscilações, eliminando imagem embaralhada e buffering
          let stableLevelIdx = -1;
          for (let i = 0; i < data.levels.length; i++) {
            const bw = data.levels[i].bitrate;
            if (bw >= 1400000 && bw <= 3200000) {
              stableLevelIdx = i;
              break;
            }
          }
          if (stableLevelIdx !== -1) {
            hls.autoLevelCapping = stableLevelIdx;
            hls.startLevel = stableLevelIdx;
            console.log(`[Player] Blindagem Anti-Travamento: Perfil ${data.levels[stableLevelIdx].height || 'HD'}p fixado (~${Math.round(data.levels[stableLevelIdx].bitrate/1000)} kbps)`);
          }
        }

        const playPromise = this.video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[Player] Autoplay com som restrito pelo navegador. Ativando mudo para iniciar vídeo:', err);
            this.video.muted = true;
            this.video.play().then(() => {
              this.callbacks.onStatus('Clique na tela para ativar o som');
            }).catch(() => {});
          });
        }
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        // Recuperação natural estilo YouTube: deixa o buffer carregar sem saltos artificiais
        if (data.details === window.Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          if (this.hls) this.hls.startLoad();
          return;
        }

        if (data.details === window.Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
          return;
        }

        if (data.fatal) {
          this.reportTelemetry('HLS_FATAL_ERROR', {
            errorType: data.type,
            details: data.details,
            fatal: data.fatal,
            networkDetails: data.networkDetails ? data.networkDetails.status : null
          });

          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              // Se ainda não estava usando o proxy, tenta o proxy
              if (!this.isUsingProxy && (window.location.protocol.startsWith('http') || true)) {
                this.isUsingProxy = true;
                const proxyUrl = (window.location.protocol.startsWith('http') ? '' : 'http://localhost:3000') + 
                  `/proxy?url=${encodeURIComponent(this.currentUrl)}`;
                this.callbacks.onStatus('Tentando via Proxy de Streaming...');
                this.playSource(proxyUrl);
              } else if (this.currentBackupUrl && !this.isUsingBackup) {
                // Tenta sinal reserva
                this.isUsingBackup = true;
                this.isUsingProxy = false;
                this.callbacks.onStatus('Alternando para sinal reserva...');
                this.playSource(this.currentBackupUrl);
              } else if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                this.callbacks.onStatus(`Reconectando (${this.retryCount}/${this.maxRetries})...`);
                hls.startLoad();
              } else {
                this.handlePlaybackFailure('Sinal temporariamente fora do ar.');
              }
              break;

            case window.Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;

            default:
              this.destroyHls();
              this.handlePlaybackFailure('Erro irrecuperável no fluxo de mídia.');
              break;
          }
        }
      });
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      // Suporte Nativo (Safari / Apple)
      this.video.src = sourceUrl;
      this.video.play().catch(() => {});
    } else {
      const msg = 'Navegador sem suporte a streaming HLS.';
      this.reportTelemetry('NO_HLS_SUPPORT');
      this.callbacks.onError(msg);
    }
  }

  handlePlaybackFailure(msg) {
    this.clearStallTimer();
    // Tenta rota de backup ou proxy antes de desistir
    if (!this.isUsingProxy && window.location.protocol.startsWith('http')) {
      this.isUsingProxy = true;
      const proxyUrl = `/proxy?url=${encodeURIComponent(this.currentUrl)}`;
      this.playSource(proxyUrl);
      return;
    }

    if (this.currentBackupUrl && !this.isUsingBackup) {
      this.isUsingBackup = true;
      this.isUsingProxy = false;
      this.playSource(this.currentBackupUrl);
      return;
    }

    this.callbacks.onError(msg);
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  setVolume(val) {
    val = Math.max(0, Math.min(1, val));
    this.video.volume = val;
    this.video.muted = (val === 0);
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
  }

  setAspectRatio(modeIndex) {
    const modes = IPTV_CONFIG.aspectRatios.map(r => r.id);
    this.video.classList.remove(...modes);
    const selected = IPTV_CONFIG.aspectRatios[modeIndex];
    if (selected && selected.id !== 'fit-contain') {
      this.video.classList.add(selected.id);
    }
    return selected ? selected.label : '';
  }

  // --- RECURSOS DVR (RETROCESSO DE TRANSMISSÃO AO VIVO ESTILO YOUTUBE) ---

  getSeekableRange() {
    const seekable = this.video.seekable;
    const buffered = this.video.buffered;
    let start = 0;
    let end = (this.video.duration && isFinite(this.video.duration)) ? this.video.duration : this.video.currentTime;

    if (seekable && seekable.length > 0) {
      start = seekable.start(0);
      end = seekable.end(seekable.length - 1);
    }
    // Inclui todo o backup de memória do buffer histórico retido (backBufferLength) para retrocesso livre
    if (buffered && buffered.length > 0) {
      if (buffered.start(0) < start) {
        start = buffered.start(0);
      }
      if (buffered.end(buffered.length - 1) > end) {
        end = buffered.end(buffered.length - 1);
      }
    }
    return { start, end };
  }

  getBufferedEnd() {
    const buffered = this.video.buffered;
    if (buffered && buffered.length > 0) {
      return buffered.end(buffered.length - 1);
    }
    return this.video.currentTime;
  }

  getLiveEdge() {
    const seekable = this.video.seekable;
    if (seekable && seekable.length > 0) {
      return seekable.end(seekable.length - 1);
    }
    if (this.video.buffered && this.video.buffered.length > 0) {
      return this.video.buffered.end(this.video.buffered.length - 1);
    }
    return this.video.currentTime;
  }

  isAtLiveEdge() {
    const liveEdge = this.getLiveEdge();
    const diff = liveEdge - this.video.currentTime;
    return diff <= 5;
  }

  getDVRState() {
    const range = this.getSeekableRange();
    const liveEdge = this.getLiveEdge();
    const currentTime = this.video.currentTime;
    const duration = Math.max(1, range.end - range.start);
    const currentOffset = Math.max(0, currentTime - range.start);
    const progressRatio = Math.min(1, Math.max(0, currentOffset / duration));

    const bufferedEnd = this.getBufferedEnd();
    const bufferedOffset = Math.max(0, bufferedEnd - range.start);
    const bufferRatio = Math.min(1, Math.max(0, bufferedOffset / duration));

    const secondsBehindLive = Math.max(0, liveEdge - currentTime);
    const isLive = secondsBehindLive <= 4;

    return {
      isLive,
      secondsBehindLive,
      progressRatio,
      bufferRatio,
      currentTime,
      liveEdge,
      rangeStart: range.start,
      rangeEnd: range.end,
      duration
    };
  }

  seekToLive() {
    const liveEdge = this.getLiveEdge();
    this.video.currentTime = liveEdge;
    if (this.video.paused) {
      this.video.play().catch(() => {});
    }
  }

  seekRelative(seconds) {
    const range = this.getSeekableRange();
    const target = Math.max(range.start, Math.min(range.end, this.video.currentTime + seconds));
    this.video.currentTime = target;
    if (this.video.paused) {
      this.video.play().catch(() => {});
    }
  }

  seekToRatio(ratio) {
    const range = this.getSeekableRange();
    const duration = range.end - range.start;
    const target = range.start + (Math.max(0, Math.min(1, ratio)) * duration);
    this.video.currentTime = target;
  }
}

window.StreamPlayer = StreamPlayer;

// VOLNA playback engine — Yandex-Music-style continuous queue.
// One <audio> element; OS routes it to whatever output is active (incl. Bluetooth).
import { store, clamp } from "../lib/util.js";

class Player extends EventTarget {
  constructor() {
    super();
    this.audio = new Audio();
    this.audio.preload = "metadata";
    this.queue = [];        // track objects
    this.order = [];        // indices into queue (playback order)
    this.pos = -1;          // index into order
    this.queueName = "";
    this.repeat = store.get("repeat", "off"); // off | all | one
    this.shuffle = store.get("shuffle", false);
    this.autoExtend = null; // () => track[]  (powers «Моя волна»)
    this._prevVol = 1;
    this._bind();
    this.setVolume(store.get("volume", 1), { silent: true });
  }

  _bind() {
    const a = this.audio;
    a.addEventListener("timeupdate", () => this._emit("time"));
    a.addEventListener("durationchange", () => {
      const t = this.current();
      if (t && isFinite(a.duration)) t.duration = a.duration;
      this._emit("time"); this._emit("meta");
    });
    a.addEventListener("play", () => this._emit("state"));
    a.addEventListener("pause", () => this._emit("state"));
    a.addEventListener("ended", () => this.next(true));
    a.addEventListener("error", () => this._emit("trackerror", this.current()));
  }
  _emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }

  get isPlaying() { return !this.audio.paused; }
  current() { return this.pos >= 0 ? this.queue[this.order[this.pos]] : null; }

  _buildOrder(startIndex = 0) {
    const n = this.queue.length;
    const order = [...Array(n).keys()];
    if (this.shuffle) {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const k = order.indexOf(startIndex);
      if (k > 0) { order.splice(k, 1); order.unshift(startIndex); }
    }
    this.order = order;
    this.pos = Math.max(0, order.indexOf(startIndex));
  }

  setQueue(tracks, startIndex = 0, { play = true, name = "" } = {}) {
    if (!tracks || !tracks.length) return;
    this.queue = tracks.slice();
    this.queueName = name || this.queueName;
    this._buildOrder(clamp(startIndex, 0, tracks.length - 1));
    this._load({ play });
    this._emit("queuechange");
  }

  _load({ play = true } = {}) {
    const t = this.current();
    if (!t) return;
    this.audio.src = t.src;
    this.audio.load();
    this._emit("trackchange", t);
    if (play) this.play();
    else this._emit("state");
  }

  play() {
    const p = this.audio.play();
    if (p && p.catch) p.catch(() => this._emit("state")); // autoplay blocked → reflect paused UI
  }
  pause() { this.audio.pause(); }
  toggle() { if (!this.current()) return; this.audio.paused ? this.play() : this.pause(); }

  next(auto = false) {
    if (auto && this.repeat === "one") { this.seek(0); this.play(); return; }
    if (this.pos < this.order.length - 1) { this.pos++; return this._load({ play: true }); }
    if (this.autoExtend) {
      const more = this.autoExtend() || [];
      if (more.length) {
        const base = this.queue.length;
        this.queue.push(...more);
        this.order.push(...more.map((_, i) => base + i));
        this.pos++;
        this._emit("queuechange");
        return this._load({ play: true });
      }
    }
    if (this.repeat === "all") { this.pos = 0; return this._load({ play: true }); }
    this.audio.pause(); this._emit("state"); // reached the end
  }

  prev() {
    if (this.audio.currentTime > 3) return this.seek(0);
    if (this.pos > 0) { this.pos--; this._load({ play: true }); }
    else this.seek(0);
  }

  /** jump to a position in the current play order (queue UI clicks) */
  playPos(p) {
    if (p < 0 || p >= this.order.length) return;
    this.pos = p;
    this._load({ play: true });
  }

  removeAt(qi) {
    if (qi < 0 || qi >= this.queue.length) return;
    const curQ = this.order[this.pos];
    this.queue.splice(qi, 1);
    this.order = this.order.filter((i) => i !== qi).map((i) => (i > qi ? i - 1 : i));
    if (curQ === qi) {
      this.pos = clamp(this.pos, 0, this.order.length - 1);
      if (this.order.length) this._load({ play: !this.audio.paused });
      else { this.audio.pause(); this.pos = -1; }
    } else {
      this.pos = this.order.indexOf(curQ > qi ? curQ - 1 : curQ);
    }
    this._emit("queuechange");
  }

  seek(t) { if (isFinite(this.audio.duration)) this.audio.currentTime = clamp(t, 0, this.audio.duration); }
  seekBy(d) { this.seek((this.audio.currentTime || 0) + d); }

  setVolume(v, { silent = false } = {}) {
    v = clamp(v, 0, 1);
    this.audio.volume = v;
    if (v > 0) this._prevVol = v;
    store.set("volume", v);
    if (!silent) this._emit("volume", v);
  }
  toggleMute() {
    if (this.audio.volume > 0) { this._prevVol = this.audio.volume; this.setVolume(0); }
    else this.setVolume(this._prevVol || 0.8);
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    store.set("shuffle", this.shuffle);
    const cur = this.order[this.pos];
    this._buildOrder(cur >= 0 ? cur : 0);
    this._emit("modes"); this._emit("queuechange");
    return this.shuffle;
  }
  cycleRepeat() {
    this.repeat = this.repeat === "off" ? "all" : this.repeat === "all" ? "one" : "off";
    store.set("repeat", this.repeat);
    this._emit("modes");
    return this.repeat;
  }
}

export const player = new Player();

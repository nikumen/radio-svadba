// Bluetooth / audio-output routing.
// Where the platform exposes setSinkId + selectAudioOutput (Chromium desktop),
// the user can pick a specific output (e.g. a Bluetooth speaker). Elsewhere the
// OS routes the <audio> to the active system output — which is the connected
// Bluetooth device — automatically.
import { toast } from "../ui/toast.js";

export function setupOutput(player, btn, dot) {
  if (!btn) return;
  const audio = player.audio;
  const canSelect = !!(navigator.mediaDevices && navigator.mediaDevices.selectAudioOutput);
  const canSink = typeof audio.setSinkId === "function";

  btn.addEventListener("click", async () => {
    if (canSelect && canSink) {
      try {
        const device = await navigator.mediaDevices.selectAudioOutput();
        if (device && device.deviceId) {
          await audio.setSinkId(device.deviceId);
          if (dot) dot.hidden = false;
          btn.classList.add("is-on");
          toast("Вывод → " + (device.label || "выбранное устройство"), "accent");
        }
      } catch (err) {
        if (err && err.name === "NotAllowedError") toast("Выбор устройства отменён");
        else toast("Не удалось переключить устройство вывода");
      }
    } else {
      toast("Звук идёт на системный выход — подключите Bluetooth в настройках устройства", "accent");
    }
  });
}

"use strict";

// Append future weeks with new IDs. Keep existing week/day/exercise IDs stable:
// saved comments are keyed by these IDs, independently of the training program.
window.REHAB_PLAN = (() => {
  const days = [
    [
      ["seated-russian-twist", "Seated russian twist", "2 x 3 4kg", "2 x 5 R/L 4kg"],
      ["plank-walk-out", "Plank walk out", "2 x 3", "2 x 5"],
      ["jefferson-curl", "Jefferson curl", "2 x 5 met 5kg", "2 x 8 met 5kg"],
      ["shoulder-taps", "Shoulder taps", "2 x 20 (10/10)", "2 x 30 (15/15)"],
      ["side-plank", "Side plank", "2 x 20s per kant continu", "2 x 25s per kant continu"],
      ["ski", "Ski", "2 x 30 seconden", "3 x 30 seconden"],
    ],
    [
      ["huppelen", "Huppelen", "10x15m", "10x15m"],
      ["slump-bounds", "Slump bounds", "2 x 5 per been", "2 x 7 per been"],
      ["sled-acceleratie", "Sled acceleratie", "5 x 10m progressief met 10kg", "7 x 10m progressief met 10kg"],
      ["foamroller-hamstring-bridge", "Foamroller hamstring bridge", "2 benen 30 seconden", "2 benen 30 seconden"],
      ["calve-raises", "Calve raises", "2 x 10 smith machine", "2 x 12 smith machine single leg"],
    ],
    [
      ["kneeling-side-throw", "Kneeling side throw", "2 x 3 4kg", "2 x 5 4kg"],
      ["reverse-plank", "Reverse plank", "2 x 5", "2 x 7"],
      ["highbar-atg-squat", "Highbar ATG squat", "2 x 5 stang", "2 x 8 stang"],
      ["drops-van-step", "Drops van step", "2 x 10 hoge step", "2 x 10 hoge step"],
      ["superman-planks", "Superman planks", "2 x 5", "2 x 5 per kant"],
      ["row", "Row", "2 x 30 seconden", "3 x 30 seconden"],
    ],
    [
      ["huppelen", "Huppelen", "10x15m", "10x15m"],
      ["half-rotation-monkey-jumps", "Half rotation monkey jumps", "2 x 10m", "2 x 10m"],
      ["sled-acceleratie", "Sled acceleratie", "5 x 10m progressief met 10kg", "3 x 20m progressief met slee"],
      ["copenhagen-iso", "Copenhagen ISO", "short lever 1x20 sec per kant", "short lever 1x25 sec per kant"],
      ["mb-slam", "MB slam", "2 x 5 max 3kg", "2 x 7 max 3kg"],
    ],
  ];
  // Week 2 started on Monday 26 October 2026. Later prescriptions come from Max;
  // future weeks intentionally contain no exercises until supplied.
  const startDates = ["2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16"];
  return [1, 2, 3, 4, 5].map((week) => ({
    id: `week-${week}`,
    label: `Week ${week}`,
    startDate: startDates[week - 1],
    days: days.map((exercises, index) => ({
      id: `day-${index + 1}`,
      label: `Dag ${index + 1}`,
      exercises: week > 2 ? [] : exercises.map(([id, name, first, second]) => ({ id, name, prescription: week === 1 ? first : second })),
    })),
  }));
})();

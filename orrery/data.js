/* ===================================================================
   data.js — physical parameters + curated facts/fallbacks
   Units: a in AU, period in Julian years, radius in km, mass in Earths,
   tilt in degrees, day = sidereal rotation period in Earth days.
   =================================================================== */
window.SUN = {
  id: "sun", name: "The Sun", kind: "G-type star",
  radiusKm: 696340, day: 27, tilt: 7.25, wiki: "Sun",
  color: 0xffcc55, emissive: 0xff9a2a,
};

window.BODIES = [
  { id:"mercury", name:"Mercury", kind:"Terrestrial planet", a:0.387, period:0.2408, radiusKm:2439.7, mass:0.055, tilt:0.03,  day:58.65,  eccentricity:0.206, color:0x9c8b7a, wiki:"Mercury" },
  { id:"venus",   name:"Venus",   kind:"Terrestrial planet", a:0.723, period:0.6152, radiusKm:6051.8, mass:0.815, tilt:177.4, day:-243.0, eccentricity:0.007, color:0xd9b27a, wiki:"Venus" },
  { id:"earth",   name:"Earth",   kind:"Our home world",     a:1.000, period:1.0000, radiusKm:6371.0, mass:1.000, tilt:23.44, day:0.997,  eccentricity:0.017, color:0x4f7fff, wiki:"Earth",
    moons:[ { id:"moon", name:"The Moon", kind:"Natural satellite", a:0.00257, period:0.0748, radiusKm:1737.4, mass:0.0123, tilt:6.68, day:27.32, color:0xbfbfbf, wiki:"Moon" } ] },
  { id:"mars",    name:"Mars",    kind:"Terrestrial planet", a:1.524, period:1.8808, radiusKm:3389.5, mass:0.107, tilt:25.19, day:1.026,  eccentricity:0.093, color:0xc1502e, wiki:"Mars" },
  { id:"jupiter", name:"Jupiter", kind:"Gas giant",          a:5.203, period:11.862, radiusKm:69911,  mass:317.8, tilt:3.13,  day:0.414,  eccentricity:0.048, color:0xd8b48c, wiki:"Jupiter", bands:true },
  { id:"saturn",  name:"Saturn",  kind:"Gas giant",          a:9.537, period:29.457, radiusKm:58232,  mass:95.16, tilt:26.73, day:0.444,  eccentricity:0.056, color:0xe3c98b, rings:true, wiki:"Saturn", bands:true },
  { id:"uranus",  name:"Uranus",  kind:"Ice giant",          a:19.19, period:84.011, radiusKm:25362,  mass:14.54, tilt:97.77, day:-0.718, eccentricity:0.046, color:0x9fe3e8, wiki:"Uranus", rings:true },
  { id:"neptune", name:"Neptune", kind:"Ice giant",          a:30.07, period:164.79, radiusKm:24622,  mass:17.15, tilt:28.32, day:0.671,  eccentricity:0.010, color:0x3b5bff, wiki:"Neptune" },
];

/* Curated fallback facts. Wikipedia summaries are appended live when online,
   but these guarantee an endless, always-available stream. */
window.FACTS = {
  sun: [
    "The Sun holds 99.86% of all the mass in the Solar System.",
    "About 1.3 million Earths could fit inside the Sun.",
    "Light from the Sun's surface takes ~8 minutes 20 seconds to reach Earth.",
    "The Sun's core is roughly 15 million °C and fuses ~600 million tonnes of hydrogen every second.",
    "The Sun is a near-perfect sphere — its poles and equator differ by only ~10 km.",
    "It's about 4.6 billion years old, roughly halfway through its life as a stable star.",
    "The Sun travels around the Milky Way once every ~225 million years.",
    "Its surface (photosphere) is ~5,500 °C, far cooler than the million-degree corona above it.",
    "In ~5 billion years the Sun will swell into a red giant and likely engulf Mercury and Venus.",
    "The Sun is mostly hydrogen (~73%) and helium (~25%) by mass.",
  ],
  mercury: [
    "A year on Mercury lasts just 88 Earth days — the fastest orbit in the Solar System.",
    "Mercury's day is longer than its year: one solar day lasts about 176 Earth days.",
    "Despite being closest to the Sun, Mercury isn't the hottest planet — Venus is.",
    "Temperatures swing from about 430 °C in daylight to -180 °C at night.",
    "Mercury has a giant iron core making up ~60% of its mass.",
    "It has a faint, ancient magnetic field — about 1% the strength of Earth's.",
    "Frozen water hides in permanently shadowed craters at Mercury's poles.",
    "Mercury is shrinking — its core cooled and the surface wrinkled into huge cliffs.",
  ],
  venus: [
    "Venus spins backwards — the Sun there rises in the west and sets in the east.",
    "Its thick CO₂ atmosphere makes Venus the hottest planet at about 465 °C.",
    "Surface pressure on Venus is ~92× Earth's — like being 900 m underwater.",
    "A day on Venus is longer than its year.",
    "Venus is the brightest natural object in our night sky after the Moon.",
    "It rains sulfuric acid in the upper clouds, though it evaporates before landing.",
    "Venus is often called Earth's 'twin' for its similar size and mass.",
  ],
  earth: [
    "Earth is the only known place in the universe confirmed to host life.",
    "It's the densest planet in the Solar System.",
    "Earth isn't a perfect sphere — it bulges at the equator.",
    "Roughly 71% of Earth's surface is covered by water.",
    "Earth's rotation is gradually slowing — days grow ~1.7 ms longer per century.",
    "Our magnetic field deflects the solar wind and shields life from radiation.",
    "Earth is the only planet not named after a Greek or Roman deity.",
  ],
  moon: [
    "The Moon is drifting away from Earth at about 3.8 cm per year.",
    "It always shows us the same face — its rotation is tidally locked to Earth.",
    "The Moon likely formed when a Mars-sized body struck the early Earth.",
    "Moonquakes are real and can last for many minutes.",
    "The Moon's gravity is the main driver of Earth's ocean tides.",
    "Footprints left by Apollo astronauts could last millions of years.",
  ],
  mars: [
    "Mars hosts Olympus Mons, the tallest volcano in the Solar System at ~22 km.",
    "Its red color comes from iron oxide — literally rust — on the surface.",
    "Mars has the largest dust storms in the Solar System, sometimes global.",
    "A day on Mars (a 'sol') is just 37 minutes longer than Earth's.",
    "Mars has two tiny moons, Phobos and Deimos, likely captured asteroids.",
    "Valles Marineris is a canyon system over 4,000 km long.",
    "Ancient river valleys suggest Mars once had liquid water on its surface.",
  ],
  jupiter: [
    "Jupiter is so massive that all other planets could fit inside it twice over.",
    "Its Great Red Spot is a storm wider than Earth that's raged for centuries.",
    "Jupiter has the shortest day of any planet — under 10 hours.",
    "It has at least 95 known moons, including Ganymede, the largest in the system.",
    "Jupiter's magnetic field is the strongest of any planet.",
    "It acts as a cosmic shield, deflecting many comets away from the inner planets.",
    "Jupiter radiates more heat than it receives from the Sun.",
  ],
  saturn: [
    "Saturn's rings are made mostly of ice and span ~280,000 km, yet are only ~10 m thick in places.",
    "Saturn is the least dense planet — it would float in a big enough bathtub of water.",
    "Its moon Titan has lakes and rivers of liquid methane.",
    "Saturn has a hexagon-shaped jet stream at its north pole.",
    "It has over 140 confirmed moons, the most of any planet.",
    "Winds in Saturn's atmosphere can reach 1,800 km/h.",
  ],
  uranus: [
    "Uranus is tipped on its side, rolling around the Sun at a ~98° tilt.",
    "Because of that tilt, each pole gets ~42 years of continuous sunlight, then darkness.",
    "Uranus is the coldest planet, with temperatures down to about -224 °C.",
    "It was the first planet discovered with a telescope, in 1781.",
    "Its blue-green color comes from methane in the atmosphere.",
    "Uranus has faint rings and 27 known moons named after literary characters.",
  ],
  neptune: [
    "Neptune was found through math before it was ever seen, in 1846.",
    "It has the fastest winds in the Solar System — up to 2,100 km/h.",
    "One Neptune year lasts about 165 Earth years.",
    "Its moon Triton orbits backwards and is likely a captured dwarf planet.",
    "Neptune radiates ~2.6× more energy than it gets from the Sun.",
    "Its vivid blue comes from methane plus an unknown additional compound.",
  ],
};

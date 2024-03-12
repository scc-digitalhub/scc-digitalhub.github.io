const paths = [
    "M0,250 500,250 700,170 1200,170 1400,90 3000,90",
    "M0,250 800,250 925,200 1400,200 1600,120 3000,120",
    "M0,280 1100,280 1225,230 1600,230 1800,150 3000,150",
    "M0,350 600,350 725,400 3000,400",
    "M0,620 350,620 475,670 3000,670",
    "M0,620 350,620 475,670 600,670 800,750 3000,750"
]

const pathsBuildTimes = [ 2400, 2700, 2000, 2100, 3000, 2500 ]

const impulseDelays = [ 1800, 2200, 1300, 1500, 2500, 2000 ]

const trailAlpha =  [ "ff", "dd", "bb", "99", "66", "33" ]
const trailAdditionalDelay = 4

let bg = document.getElementById("bg-animation")
if (paths.length === 6 && pathsBuildTimes.length === 6 && impulseDelays.length === 6) {
    for (let i = 0; i < paths.length; i++) {
        let path = document.getElementById("impulse-path-" + i)
        path.setAttribute("d", paths[i])
        path.style.animation = "dash " + pathsBuildTimes[i] + "ms linear forwards"

        let impulse = document.createElement("div")
        impulse.classList.add("impulse")
        impulse.style.offsetPath = 'path("' + paths[i] + '")'
        impulse.style.animationDelay = impulseDelays[i] + "ms"
        bg.appendChild(impulse)

        for (let j = 0; j < trailAlpha.length; j++) {
            let trail = document.createElement("div")
            trail.classList.add("impulse-trail")
            trail.style.offsetPath = 'path("' + paths[i] + '")'
            trail.style.animationDelay = (impulseDelays[i] + trailAdditionalDelay * (j + 1)) + "ms"
            trail.style.backgroundColor = "#e3ab44" + trailAlpha[j]

            bg.appendChild(trail)
        }
    }
} else {
    console.warn("Circuit effect not drawn due to misconfiguration: lengths of paths, pathsBuildTimes and impulseDelays must be 6.")
}
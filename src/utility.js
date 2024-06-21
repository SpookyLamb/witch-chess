

export function formatSeconds(seconds) {
    //takes a time in seconds, returns a string converted to minute:seconds format
    const minutes = Math.floor(seconds / 60)
    const remainder = seconds % 60

    if (remainder < 10) {
        return minutes.toString() + ":0" + remainder.toString() //leading zero
    } else {
        return minutes.toString() + ":" + remainder.toString()
    }
}

export function tick(func) {
    //takes a function and calls it after one second with setTimeout
    setTimeout(() => {func()}, 1000)
}
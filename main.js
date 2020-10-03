var timer = document.querySelector('.timer');
var toggleBtn = document.querySelector('.toggle');
var resetBtn = document.querySelector('.reset');
var lapBtn = document.querySelector('.lap');
var lapContainer = document.querySelector('.lapContainer')

var watch = new Stopwatch(timer);

function start() {
    toggleBtn.textContent = 'Stop';
    toggleBtn.classList.toggle("on");
    watch.start();
}

function stop() {
    toggleBtn.textContent = 'Start';
    toggleBtn.classList.toggle("on")
    watch.stop();
}

function stopWhenOn() {
    toggleBtn.textContent = 'Start';
    toggleBtn.classList.toggle("on")
    watch.stop();
    watch.reset();
}

toggleBtn.addEventListener('click', function () {
    watch.isOn ? stop() : start();
});

resetBtn.addEventListener('click', function () {
    watch.isOn ? stopWhenOn() : watch.reset();
    // stop();
});

lapBtn.addEventListener('click', function () {
    watch.isOn ? watch.lapOn() : watch.lapOff();
})

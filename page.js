const sonneries = [
    // Liste de toutes les sonneries à mettre à jour en cas de changement
    // Format : hh:mm:ss
    // Chaque ligne représente un jour de la semaine
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:00:00', '15:55:00', '16:05:00', '17:00:00', '17:04:00', '17:59:00'],
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:00:00', '15:55:00', '16:05:00', '17:00:00', '17:04:00', '17:59:00'],
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:00:00', '15:55:00', '16:05:00', '17:00:00', '17:04:00', '17:59:00'],
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:00:00', '15:55:00', '16:05:00', '17:00:00', '17:04:00', '17:59:00'],
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:06:00', '16:01:00', '16:05:00', '17:00:00', '17:04:00'],
    [],
    []
];


window.toggled = false; // Variable utilisée pour connaitre l'état de la vue des timers

function toggle_view(type) {
    /** Inverse le type de vue. `type` est l'id de la vue sur laquelle se concentrer.
     */
    if (type === "next_alarm") {
        var other_elem = document.getElementById("remaining_time");
    } else if (type === "remaining_time") {
        var other_elem = document.getElementById("next_alarm");
    } else return;

    let settings_icon = document.getElementById("parameter_icon_container");

    if (window.toggled) {
        other_elem.style = "";
        settings_icon.style = "opacity: 100%";
    } else {
        other_elem.style = "max-height: 0px; opacity: 0%";
        settings_icon.style = "opacity: 0;";
    }
    window.toggled = !window.toggled;
}

function update() {
    /** Fonction appelée de manière régulière pour mettre à jour les timers.*/

    // On récupère les éléments timer
    let remainingTimeElement = document.getElementById("remaining_time_alarm");
    let nextAlarmElement = document.getElementById("next_alarm_timer");
    let timerContainerElement = document.getElementById("timers_elements_container");
    let noAlarmElement = document.getElementById("no_alarm");

    // Récupère le jour et l'heure actuelle
    let date = new Date()
    let day = date.getDay() - 1;

    // Récupère les sonneries de la journée actuelle
    let todayAlarms = sonneries[day];

    // Récupère la prochaine sonnerie
    const currentTimeStr = date.toLocaleTimeString('en-US', { hour12: false });
    const nextAlarm = todayAlarms.filter(time => time > currentTimeStr)[0];

    // Si aucune alarme n'est prevue, on quitte la fonction
    if (nextAlarm === undefined) {
        timerContainerElement.style = "display: none";
        noAlarmElement.style = "";
        return;
    } else {
        timerContainerElement.style = "";
        noAlarmElement.style = "display: none";
    }

    let nextAlarmHourInt = parseInt(nextAlarm.substring(0, 2));
    let nextAlarmMinuteInt = parseInt(nextAlarm.substring(3, 5));
    let nextAlarmSecondsInt = parseInt(nextAlarm.substring(6, 8));

    let totalCurrentDaySeconds = date.getSeconds() + date.getMinutes() * 60 + date.getHours() * 3600
    let totalNextAlarmDaySeconds = nextAlarmHourInt * 3600 + nextAlarmMinuteInt * 60 + nextAlarmSecondsInt


    // Calcule les valeurs des timers
    let totalRemainingSeconds = totalNextAlarmDaySeconds - totalCurrentDaySeconds;
    let remainingHour = Math.floor(totalRemainingSeconds / 3600);
    let remainingMinutes = Math.floor(totalRemainingSeconds / 60) - remainingHour * 60;
    let remainingSeconds = Math.floor(totalRemainingSeconds) - remainingMinutes * 60 - remainingHour * 3600;


    // Met à jour les timers
    if (remainingHour === 0) {
        remainingTimeElement.innerText = ("00" + remainingMinutes).slice(-2) + ":" + ("00" + remainingSeconds).slice(-2)
    } else {
        remainingTimeElement.innerText = ("00" + remainingHour).slice(-2) + ":" + ("00" + remainingMinutes).slice(-2)
    }

    nextAlarmElement.innerText = nextAlarm.substring(0, 5);

}

// Lance l'execution régulière de `update()`. 
// Le timeout est de 200 ms pour éviter la désincronisation et avoir une grande précision des secondes.
setInterval(update, 200);
/**
 * Code source de la page des timers avant la sonnerie.
 * Ce code est volontairement non obfusqué et bien commenté pour qu'il
 * soit facilement comprehenssible pour des personnes (comme moi [Yannis])
 * qui aime faire ctrl + maj + I ou F12.
 * Merci de ne pas m'insulter en me disant "Oh mais t'es nul ! Tu pouvais utiliser
 * cette fonction pour rendre la page plus rapide...". Je sais que certaines parties
 * du code ne sont pas les plus optimisées. Si vous aves des idées d'optimisation
 * et / ou d'amélioration ou même des bugs, vous pouvez faire une issue sur:
 * https://github.com/autiinpu2/timer-sonneries.
 * 
 * Ce code est actuelement sous license MIT donc vous pouvez librement le réutiliser.
 * Bonne journée !
 * 
 * (Ce commentaire est quand même très long et un peu inutile mais bon... Il ne fait pas de mal)
 */

const sonneries = [
    // Liste de toutes les sonneries à mettre à jour en cas de changement
    // Format : hh:mm:ss
    // Chaque ligne représente un jour de la semaine
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:00:00', '15:55:00', '16:05:00', '17:00:00', '17:04:00', '17:59:00'],
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:00:00', '15:55:00', '16:05:00', '17:00:00', '17:04:00', '17:59:00'],
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:00:00', '15:55:00', '16:05:00', '17:00:00', '17:04:00', '17:59:00'],
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:00:00', '15:55:00', '16:05:00', '17:00:00', '17:04:00', '17:59:00'],
    ['07:56:00', '08:01:00', '08:56:00', '09:00:00', '09:55:00', '10:05:00', '11:00:00', '11:04:00', '11:59:00', '12:03:00', '12:58:00', '13:02:00', '13:57:00', '14:01:00', '14:56:00', '15:06:00', '16:01:00', '16:05:00', '17:00:00', '17:04:00'],
    ["10:56:00", "19:25:32"],
    []
];


window.toggled_view = false; // Utilisée pour connaitre l'état de la vue des timers
window.settings_opened = false; // Utlisée pour connaitre l'état d'ouverture des paramètres


function toggle_view(type) {
    /** Inverse le type de vue. `type` est l'id de la vue sur laquelle se concentrer.
     */

    // Si les paramètre sont ouverts, on les ferme
    if (window.settings_opened) toggle_settings_bar();

    // Réupère l'ID de l'élément à cacher
    if (type === "next_alarm") {
        var other_elem = document.getElementById("remaining_time");
    } else if (type === "remaining_time") {
        var other_elem = document.getElementById("next_alarm");
    } else return;

    // Récupère le logo des paramètres et change l'opacité en fonction du type de vue
    let settings_icon = document.getElementById("settings_icon_container");

    if (window.toggled_view) {
        other_elem.style = "";
        settings_icon.style = "opacity: 1";
    } else {
        other_elem.style = "max-height: 0px; opacity: 0";
        settings_icon.style = "opacity: 0";
    }
    window.toggled_view = !window.toggled_view;
}

function toggle_settings_bar() {
    let settingsBar = document.getElementById("settings_bar");
    let settingsIcon = document.getElementById("settings_icon_container");
    if (window.settings_opened) {
        settingsBar.style = "width: 0px";
        if (window.toggled_view) {
            settingsIcon.style = "opacity: 0"
        } else {
            settingsIcon.style = "opacity: 1"
        }
    } else {
        settingsBar.style = "width: 370px";
        settingsIcon.style = "opacity: 1"
    }
    window.settings_opened = !window.settings_opened;
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

    // Si aucune alarme n'est prevue, on quitte la fonction et on met un message d'erreur
    if (nextAlarm === undefined) {
        timerContainerElement.style = "display: none";
        noAlarmElement.style = "";
        return;
    } else {
        timerContainerElement.style = "";
        noAlarmElement.style = "display: none";
    }

    // Récupère l'heure de la procaine sonnerie en int
    let nextAlarmHourInt = parseInt(nextAlarm.substring(0, 2));
    let nextAlarmMinuteInt = parseInt(nextAlarm.substring(3, 5));
    let nextAlarmSecondsInt = parseInt(nextAlarm.substring(6, 8));

    // Calcule le temps écoulé entre minuit et maintenant
    // Et entre minuit et la prochaine sonnerie
    let totalCurrentDaySeconds = date.getSeconds() + date.getMinutes() * 60 + date.getHours() * 3600
    let totalNextAlarmDaySeconds = nextAlarmHourInt * 3600 + nextAlarmMinuteInt * 60 + nextAlarmSecondsInt


    // Calcule les valeurs des timers
    // Récupère le temps en seconde avant 
    // la prochaie sonnerie et le convertit en heure, minutes et secondes
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

function setColor(elems) {
    if (elems === "labels") {
        document.getElementById("choose_labels_color").click();
    } else if (elems === "background") {
        document.getElementById("choose_background_color").click();
    }
}

function saveSettings() {

    // Récupère les éléments couleur
    let labelColorElement = document.getElementById("choose_labels_color");
    let backgroundColorElement = document.getElementById("choose_background_color");

    // Met à jour l'icon d'enregistrement
    let saveIconElement = document.getElementById("save_icon");
    let savedIconElement = document.getElementById("saved_icon");
    saveIconElement.hidden = true;
    savedIconElement.hidden = false;

    // Crée l'objet de paramètres
    let settingsObject = {
        "label_color": labelColorElement.value,
        "background_color": backgroundColorElement.value,
    }

    // Encode les paramètres
    let settingsObjectStringified = JSON.stringify(settingsObject);
    let settingB64Encoded = btoa(settingsObjectStringified);

    // Met à jour le cookie de paramètres
    document.cookie = "settings=" + settingB64Encoded + "; path=/; max-age=126144000; SameSite=None; secure=false";
}

function loadSettings() {

    // Récupère les cookies
    let cookies = document.cookie.split("; ");

    // Scanne tous les cookies
    for (let i = 0; i < cookies.length; i++) {
        // Vérifie que le cookie est bien un cookie des paramètres 
        if (cookies[i].substring(0, 9) === "settings=") {
            // Désencode le cookie
            let b64EncodedSettings = cookies[i].substring(9);
            let settingsObjectStringified = atob(b64EncodedSettings);
            let settingsObject = JSON.parse(settingsObjectStringified);

            //Récupère les éléments à mondifier
            let labelColorElement = document.getElementById("choose_labels_color");
            let backgroundColorElement = document.getElementById("choose_background_color");

            // Modifie les valers des éléments
            labelColorElement.value = settingsObject["label_color"];
            backgroundColorElement.value = settingsObject["background_color"];

            // Met à jour le CSS
            document.documentElement.style.setProperty('--text-color', settingsObject["label_color"]);
            document.documentElement.style.setProperty('--background-color', settingsObject["background_color"]);

            // Met à jour les couleurs des sélécteurs
            document.querySelector('#choose_labels_color').dispatchEvent(new Event('input', { bubbles: true }));
            document.querySelector('#choose_background_color').dispatchEvent(new Event('input', { bubbles: true }));

            break;
        }
    }
}

// Paramètre les éléments Coloris
Coloris({
    themeMode: 'dark',
    alpha: false,
    margin: 30,
    defaultColor: "#FFFFFF",
    onChange: (color, input) => {
        if (input.id === "choose_labels_color") document.documentElement.style.setProperty('--text-color', color);
        else if (input.id === "choose_background_color") document.documentElement.style.setProperty('--background-color', color);

        // Met à jour l'icon d'enregistrement
        let saveIconElement = document.getElementById("save_icon");
        let savedIconElement = document.getElementById("saved_icon");
        saveIconElement.hidden = false;
        savedIconElement.hidden = true;
    }
});

// Lance l'execution régulière de `update()`. 
// Le timeout est de 200 ms pour éviter la désincronisation et avoir une grande précision des secondes.
setInterval(update, 200);
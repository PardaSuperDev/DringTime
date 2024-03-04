/**
 * Code source de la page des timers avant la sonnerie.
 * Ce code est volontairement non obfusqué et bien commenté pour qu'il
 * soit facilement comprehenssible pour des personnes (comme moi [Yannis])
 * qui aiment faire ctrl + maj + I ou F12.
 * Merci de ne pas m'insulter en me disant "Oh mais t'es nul ! Tu pouvais utiliser
 * cette fonction pour rendre la page plus rapide...". Je sais que certaines parties
 * du code ne sont pas les plus optimisées. Si vous avez des idées d'optimisation
 * et / ou d'amélioration ou même des bugs, vous pouvez faire une issue sur:
 * https://github.com/autiinpu2/timer-sonneries.
 * 
 * Ce code est actuelement sous license MIT donc vous pouvez librement le réutiliser.
 * Bonne journée !
 * 
 * (Ce commentaire est quand même très long et un peu inutile mais bon... Il ne fait pas de mal)
 */

var sonneries = [
    // Liste de toutes les sonneries à mettre à jour en cas de changement
    // Format : hh:mm:ss
    // Chaque ligne représente un jour de la semaine
    // De dimanche à samedi
    [], [], [], [], [], [], []
];


window.toggled_view = false; // Utilisée pour connaitre l'état de la vue des timers
window.settings_opened = false; // Utlisée pour connaitre l'état d'ouverture des paramètres
window.alarmsProvider = "";
window.providerList = [];
window.page = "timers"

async function updateAlarms() {
    if (window.alarmsProvider !== "") sonneries = await window.getAlarmsList(window.alarmsProvider);
}

function setup() {
    loadSettings();
    updateAlarms();
}

function toggle_page() {
    if (window.page === "timers") {
        window.page = "submit_new";
    }
}

function timers_modified() {
    if (window.onbeforeunload === null) {
        window.onbeforeunload = function () { return 'Sure?'; };
    }
}

function add_timers_row(day) {
    var inputColumns = document.getElementsByClassName("input_column");

    let newInput = document.createElement("input");
    newInput.type = "text";
    newInput.className = "timer_input stylized_button";
    newInput.name = "timer_input_0_" + 0;
    newInput.id = "timer_input_0_" + 0;
    newInput.setAttribute("onclick", "this.style=''");
    newInput.setAttribute("oninput", "timers_modified();")

    inputColumns[day].appendChild(newInput);

    // Fait réapparaitre le boutton "supprimer"
    var removeButtons = document.getElementsByClassName("remove_line_button");
    removeButtons[day].style = "";
    timers_modified();
}

function is_valid_num(value) {
    return /^\d+$/.test(value);
}

function concatenateNewAlarms() {
    var inputColumns = document.getElementsByClassName("input_column");


    var timersTableIsValid = true;

    var daysConcatenatedAlarms = [];

    for (var i = 0; i < inputColumns.length; i++) {
        let dayAlarms = [];
        let dayColumnChildren = inputColumns[i].children;
        for (var j = 0; j < dayColumnChildren.length; j++) {
            dayColumnChildren[j].style = "";
            let value = dayColumnChildren[j].value;

            // Teste la validité de l'entrée
            // Ne tentez pas de modifier la vérification pour la contourner car les données sont vérifiées dans le serveur
            if (value.length === 8 && value[2] === ":" && value[5] === ":" &&
                is_valid_num(value.substring(0, 2)) &&
                is_valid_num(value.substring(3, 5)) &&
                is_valid_num(value.substring(6, 8)) &&
                parseInt(value.substring(0, 2)) < 24 &&
                parseInt(value.substring(3, 5)) < 60 &&
                parseInt(value.substring(6, 8)) < 60
            ) {
                dayAlarms.push(value);
            } else {
                timersTableIsValid = false;
                dayColumnChildren[j].style = "background-color: #900;"
            }
        }
        daysConcatenatedAlarms.push(dayAlarms.join(";"));
    }

    return [timersTableIsValid, timersTableIsValid ? daysConcatenatedAlarms.join("-") : ""];
}

function save_new_timers() {
    var resultLabel = document.getElementById("new_timers_save_result_label");
    var timerNameInput = document.getElementById("new_timers_name_input");

    const concatenatedData = concatenateNewAlarms();

    console.log(concatenatedData);

    if (concatenatedData[0]) {
        const finalAlarmsData = concatenatedData[1];

        console.log("New Data : " + finalAlarmsData);

        const cookies = document.cookie.split("; ");

        var data = "";

        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].substring(0, 7) === "alarms=") {
                data = cookies[i].substring(7);
            }
        }

        if (data) {
            var found_existing = false;
            var decodedAlarmsData = atob(data);
            var alarms = decodedAlarmsData.split(",");
            for (var i = 0; i < alarms.length; i++) {
                var alarmData = alarms[i].split(">");
                if (alarmData[0] === timerNameInput.value) {
                    alarmData[1] = finalAlarmsData;
                    alarms[i] = alarmData[0] + ">" + alarmData[1]
                    found_existing = true;
                    break;
                }
            }

            console.log(found_existing);

            if (found_existing) {
                decodedAlarmsData = alarms.join(",");
            } else {
                decodedAlarmsData += "," + timerNameInput.value + ">" + finalAlarmsData;
            }
            document.cookie = "alarms=" + btoa(decodedAlarmsData) + "; path=/; max-age=126144000; SameSite=None; secure=false";
        } else {
            document.cookie = "alarms=" + btoa(timerNameInput.value + ">" + finalAlarmsData) + "; path=/; max-age=126144000; SameSite=None; secure=false";
        }

        resultLabel.innerText = "Sonneries sauvegardées !";
        resultLabel.style = "color: green;";
        window.onbeforeunload = null;
    } else {
        resultLabel.innerText = "Des horaires sont invalides !";
        resultLabel.style = "color: red;";
    }

    setTimeout(() => {
        resultLabel.innerText = "";
        resultLabel.style = "color: white;";
    }, 4000);

}

async function publishAlarms() {
    var timerNameInput = document.getElementById("new_timers_name_input");
    var resultLabel = document.getElementById("new_timers_save_result_label");

    const concatenatedData = concatenateNewAlarms();

    if (concatenatedData[0]) {
        try {
            await window.sendNewAlarms(timerNameInput.value, concatenatedData[1]);
            resultLabel.innerText = "Les sonneries ont bien été envoyé !";
            resultLabel.style = "color: green;";
            window.onbeforeunload = null;
        } catch (e) {
            console.warn("Impossible de publier les sonneries : " + e.message);
            resultLabel.innerText = "Ce nom de sonnerie semble déja utilisé.";
            resultLabel.style = "color: red;";
        } 
    } else {
        resultLabel.innerText = "Des horaires sont invalides !";
        resultLabel.style = "color: red;";
    }

    setTimeout(() => {
        resultLabel.innerText = "";
        resultLabel.style = "color: white;";
    }, 4000);
}

function remove_timers_row(day, removeButton) {
    var inputColumns = document.getElementsByClassName("input_column");

    if (inputColumns[day].children.length > 0) {
        var timersInputs = inputColumns[day].querySelectorAll(".timer_input");
        inputColumns[day].removeChild(timersInputs[timersInputs.length - 1]);
    }

    if (inputColumns[day].children.length === 0) removeButton.style = "display: none;";
    timers_modified();
}

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

async function updateProviders() {
    let newProviders = await window.getAlarmsProviders();
    window.providerList = newProviders;

    let providersCombo = document.getElementById("alarm_providers_combo");

    newProviders.forEach(provider => {
        var option = document.createElement('option');
        option.value = provider;
        option.innerText = provider;

        providersCombo.appendChild(option);
    });
}

async function updateProvidersCombo() {
    let alarmProvidersCombo = document.getElementById("alarm_providers_combo");
    await updateProviders();
    alarmProvidersCombo.value = window.alarmsProvider;
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
        settingsBar.style = "width: 550px";
        settingsIcon.style = "opacity: 1"
        if (window.providerList.length === 0) updateProvidersCombo();
    }

    window.settings_opened = !window.settings_opened;
}

function askSave() {
    // Met à jour l'icon d'enregistrement
    let saveIconElement = document.getElementById("save_icon");
    let savedIconElement = document.getElementById("saved_icon");
    saveIconElement.hidden = false;
    savedIconElement.hidden = true;
}

function changeProvider(element) {
    let itemindex = element.selectedIndex
    let providerValue = element.options[itemindex].value;
    if (providerValue.toLowerCase() === "rick") { window.location = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; return; }
    window.alarmsProvider = providerValue;
    updateAlarms();
    askSave();
}

async function update() {
    /** Fonction appelée de manière régulière pour mettre à jour les timers.*/

    // On récupère les éléments timer
    let remainingTimeElement = document.getElementById("remaining_time_alarm");
    let nextAlarmElement = document.getElementById("next_alarm_timer");
    let timerContainerElement = document.getElementById("timers_elements_container");
    let noAlarmElement = document.getElementById("no_alarm");
    let noAlarmProviderElement = document.getElementById("no_alarm_provider");


    // Récupère le jour et l'heure actuelle
    let date = new Date()
    let day = date.getDay();

    // Récupère les sonneries de la journée actuelle
    let todayAlarms = sonneries[day];

    // Récupère la prochaine sonnerie
    const currentTimeStr = date.toLocaleTimeString('en-US', { hour12: false });
    const nextAlarm = todayAlarms.filter(time => time > currentTimeStr)[0];

    // Si aucune alarme n'est prevue, on quitte la fonction et on met un message d'erreur
    if (window.alarmsProvider === "" || window.alarmsProvider === undefined) {
        timerContainerElement.style = "display: none";
        noAlarmProviderElement.style = "";
        noAlarmElement.style = "display: none";
        return;
    } else if (nextAlarm === undefined) {
        timerContainerElement.style = "display: none";
        noAlarmProviderElement.style = "display: none";
        noAlarmElement.style = "";
        return;
    } else {
        timerContainerElement.style = "";
        noAlarmProviderElement.style = "display: none";
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
        "alarms_provider": window.alarmsProvider
    }


    // Encode les paramètres
    let settingsObjectStringified = JSON.stringify(settingsObject);
    let settingB64Encoded = btoa(settingsObjectStringified);

    // Met à jour le cookie de paramètres
    document.cookie = "settings=" + settingB64Encoded + "; path=/timer-sonneries/; max-age=126144000; SameSite=None; secure=false";
}

async function loadSettings() {

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

            //Récupère les éléments à modifier
            let labelColorElement = document.getElementById("choose_labels_color");
            let backgroundColorElement = document.getElementById("choose_background_color");

            // Met à jour les autres paramètres
            window.alarmsProvider = settingsObject["alarms_provider"];

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

        askSave();
    }
});

// Lance l'execution régulière de `update()`. 
// Le timeout est de 200 ms pour éviter la désincronisation et avoir une grande précision des secondes.
setInterval(update, 200);

var tilt = 23.4392811;
var equinox = 31 + 28 + 21; // march 21
var latitude;
var longitude;
var day;

YEAR_RANGE = [0, 365];
DAY_RANGE  = [0, 24];
ANGLE_RANGE = [0, 90];

function get_latitude() {
    var l = parseFloat(document.getElementById('latitude').value);
    document.getElementById('latitude-range').value = l;
    return l;
}

function get_longitude() {
    var l = parseFloat(document.getElementById('longitude').value);
    document.getElementById('longitude-range').value = l;
    return l;
}

function get_date() {
    var d = parseInt(document.getElementById('date').value);
    document.getElementById('date-value').value = d;
    return d;
}

function draw_equation(equation, target, xdomain, ydomain, labels)
{
    var data = [];

    if (typeof(labels) === "undefined") {
        console.log("no labels");
        labels = {};
    }

    if (typeof(equation) === "string") {
        data = [{
                fn: equation,
                sampler: 'builtIn',
                graphType: 'polyline'
        }];
    } else if (typeof(equation) === "object") {
        for (i = 0; i < equation.length; i++) {
            data[i] = {
                fn: equation[i],
                sampler: 'builtIn',
                graphType: 'polyline'
            };
        }
    } else {
        console.log("no equation to plot");
        return;
    }

    try {
        functionPlot({
            target: target,
            xLabel: labels.x,
            yLabel: labels.y,
            title:  labels.title,
            xDomain: xdomain,
            yDomain: ydomain,
            data: data,
        });
    } catch (err) {
        console.log(err);
        alert(err);
    }
}

function draw_max_altitude(latitude) {
    var equation = "max(0,90-abs(" + latitude + "-" + tilt + "*sin(2*pi*(x-" + equinox + ")/365)))";

    draw_equation(equation, '#max-altitude', YEAR_RANGE, ANGLE_RANGE, {x: 'day', y: 'angle', title: 'maximal altitude'});
}

function sunrise_eqn(latitude) {
    // https://en.wikipedia.org/wiki/Position_of_the_Sun
    var declination = -tilt + " * cos(2*pi*(x+10)/365)";
    // https://en.wikipedia.org/wiki/Sunrise_equation
    var equation = "-tan(" + latitude + "*2*pi/360) * tan(" + declination + "*2*pi/360)";
    equation = "acos(min(1, max(-1, " + equation + ")))";

    return equation;
}

function draw_total_daylight(latitude) {
    var equation = sunrise_eqn(latitude);
    equation = "24*(" + equation + ")/pi";

    draw_equation(equation, '#total-daylight', YEAR_RANGE, DAY_RANGE, {x: 'day', y: 'hours', title: 'total daylight'});
}

function mod24(equation) {
    return "(" + equation + ") % 24";
}

function draw_sunrise(latitude, longitude) {
    var equation = sunrise_eqn(latitude);
    var sunrise = "- 12*(" + equation + ")/pi + " + solar_noon(longitude);
    var sunset  = "+ 12*(" + equation + ")/pi + " + solar_noon(longitude);

    draw_equation([mod24(sunrise), mod24(sunset)], '#sunrise', YEAR_RANGE, DAY_RANGE, {x: 'day', y: 'hours', title: 'sunrise'});
}

function total_daylight(latitude, day) {
    var max_altitude = math.max(0,90-math.abs(latitude - tilt *math.sin(2*math.PI*(day - equinox)/365)));
    var declination = -tilt * math.cos(2*math.PI*(day+10)/365);
    var sunrise_eq = -math.tan(latitude*2*math.PI/360) * math.tan(declination*2*math.PI/360);
    sunrise_eq = math.min(1, math.max(-1, sunrise_eq));

    return 24*(math.acos(sunrise_eq))/math.PI;
}

// should also depend on timezone
function solar_noon(longitude) {
    return 12 - longitude * 24 / 360;
}

function draw_day_altitude(latitude, longitude, day) {
    var max_altitude = math.max(0,90-math.abs(latitude - tilt *math.sin(2*math.PI*(day - equinox)/365)));
    var daylight = total_daylight(latitude, day);
    var equation;

    if (daylight == 0) {
        equation = "0";
    } else {
        alpha = max_altitude / (1 - math.cos((daylight/2)*2*math.PI/24));
        equation = max_altitude + " - " + alpha + " * (1 - cos(2*pi/24 * (x-" + solar_noon(longitude) + ")))";
        equation = "max(0, " + equation + ")";
    }

    draw_equation(equation, '#day-altitude', DAY_RANGE, ANGLE_RANGE, {x: 'time', y: 'angle', title: 'altitude through the day'});
}

function draw() {
    latitude = get_latitude();
    longitude = get_longitude();
    draw_max_altitude(latitude);
    draw_total_daylight(latitude);
    draw_sunrise(latitude, longitude);

    draw_day();
}

function draw_day() {
    day = get_date();
    draw_day_altitude(latitude, longitude, day);
}

function start() {
    document.getElementById('form-lat').onsubmit = function (event) {
        event.preventDefault();
        draw();
    };

    document.getElementById('form-lon').onsubmit = function (event) {
        event.preventDefault();
        draw();
    };

    document.getElementById('latitude-range').oninput = function () {
        d = parseFloat(document.getElementById('latitude-range').value);
        document.getElementById('latitude').value = d;
        latitude = d;
        draw();
    };

    document.getElementById('longitude-range').oninput = function () {
        d = parseFloat(document.getElementById('longitude-range').value);
        document.getElementById('longitude').value = d;
        longitude = d;
        draw_sunrise(latitude, longitude);
        draw_day();
    };

    document.getElementById('date').oninput = draw_day;

    draw();
}

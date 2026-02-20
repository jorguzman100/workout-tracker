let workouts = [];
let chartInstances = [];

fetch("/api/workouts/range")
  .then(response => response.json())
  .then(data => {
    workouts = Array.isArray(data) ? data : [];
    renderCharts(workouts);
  })
  .catch(() => {
    workouts = [];
    renderCharts(workouts);
  });

window.addEventListener("themechange", () => {
  renderCharts(workouts);
});

function cssValue(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function formatDay(date) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildWorkoutSummaries(data) {
  return data.map(workout => {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const duration = exercises.reduce((total, exercise) => total + toNumber(exercise.duration), 0);
    const weight = exercises.reduce((total, exercise) => total + toNumber(exercise.weight), 0);
    return {
      label: formatDay(workout.day),
      duration,
      weight,
      exercises
    };
  });
}

function buildExerciseBreakdown(data) {
  const grouped = new Map();

  data.forEach(workout => {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    exercises.forEach(exercise => {
      const label = exercise.name || "Exercise";
      const previous = grouped.get(label) || { duration: 0, weight: 0 };
      grouped.set(label, {
        duration: previous.duration + toNumber(exercise.duration),
        weight: previous.weight + toNumber(exercise.weight)
      });
    });
  });

  const labels = Array.from(grouped.keys());

  if (!labels.length) {
    return {
      labels: ["No Workouts"],
      duration: [1],
      weight: [1]
    };
  }

  const duration = labels.map(label => grouped.get(label).duration);
  const weight = labels.map(label => grouped.get(label).weight);

  return { labels, duration, weight };
}

function destroyCharts() {
  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];
}

function palette(size) {
  const baseColors = [
    cssValue("--chart-primary", "#4a7bf2"),
    cssValue("--chart-secondary", "#66b8ff"),
    "#6ad4ff",
    "#7fb4ff",
    "#7dd6c8",
    "#9cc2ff",
    "#74c8fb",
    "#86b7e8"
  ];
  const colors = [];
  for (let i = 0; i < size; i += 1) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

function chartDefaults() {
  const textColor = cssValue("--text", "#1f2a3d");
  const gridColor = cssValue("--chart-grid", "rgba(95,111,134,0.25)");

  Chart.defaults.global.defaultFontFamily = "\"Manrope\", sans-serif";
  Chart.defaults.global.defaultFontColor = textColor;
  Chart.defaults.global.defaultFontSize = 13;

  return { textColor, gridColor };
}

function renderCharts(data) {
  if (!window.Chart) {
    return;
  }

  destroyCharts();

  const summary = buildWorkoutSummaries(data);
  const labels = summary.length ? summary.map(item => item.label) : ["No Data"];
  const durationData = summary.length ? summary.map(item => item.duration) : [0];
  const weightData = summary.length ? summary.map(item => item.weight) : [0];
  const breakdown = buildExerciseBreakdown(data);
  const breakdownPalette = palette(breakdown.labels.length);
  const { textColor, gridColor } = chartDefaults();
  const primary = cssValue("--chart-primary", "#4a7bf2");
  const secondary = cssValue("--chart-secondary", "#66b8ff");

  const lineContext = document.querySelector("#canvas").getContext("2d");
  const barContext = document.querySelector("#canvas2").getContext("2d");
  const pieContext = document.querySelector("#canvas3").getContext("2d");
  const donutContext = document.querySelector("#canvas4").getContext("2d");
  const donutValues = breakdown.weight.some(value => value > 0) ? breakdown.weight : [1];
  const donutLabels = breakdown.weight.some(value => value > 0) ? breakdown.labels : ["No Weight Data"];
  const donutPalette = breakdown.weight.some(value => value > 0) ? breakdownPalette : [secondary];

  chartInstances.push(new Chart(lineContext, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Minutes",
          data: durationData,
          borderColor: primary,
          backgroundColor: "transparent",
          pointBackgroundColor: primary,
          pointRadius: 4,
          borderWidth: 3
        }
      ]
    },
    options: {
      legend: {
        labels: { fontColor: textColor }
      },
      scales: {
        xAxes: [{
          gridLines: { color: gridColor },
          ticks: { maxRotation: 0, minRotation: 0 }
        }],
        yAxes: [{
          gridLines: { color: gridColor },
          ticks: { beginAtZero: true }
        }]
      }
    }
  }));

  chartInstances.push(new Chart(barContext, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Pounds",
          data: weightData,
          backgroundColor: secondary,
          borderColor: primary,
          borderWidth: 1.2
        }
      ]
    },
    options: {
      legend: {
        labels: { fontColor: textColor }
      },
      scales: {
        xAxes: [{
          gridLines: { color: gridColor }
        }],
        yAxes: [{
          gridLines: { color: gridColor },
          ticks: { beginAtZero: true }
        }]
      }
    }
  }));

  chartInstances.push(new Chart(pieContext, {
    type: "pie",
    data: {
      labels: breakdown.labels,
      datasets: [
        {
          label: "Exercise Duration",
          backgroundColor: breakdownPalette,
          data: breakdown.duration
        }
      ]
    },
    options: {
      legend: {
        position: "bottom",
        labels: { fontColor: textColor, boxWidth: 14, padding: 14 }
      }
    }
  }));

  chartInstances.push(new Chart(donutContext, {
    type: "doughnut",
    data: {
      labels: donutLabels,
      datasets: [
        {
          label: "Weight Split",
          backgroundColor: donutPalette,
          data: donutValues
        }
      ]
    },
    options: {
      legend: {
        position: "bottom",
        labels: { fontColor: textColor, boxWidth: 14, padding: 14 }
      }
    }
  }));
}

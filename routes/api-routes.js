const router = require("express").Router();
const mongoose = require("mongoose");

const db = require("../models");

function sendRouteError(res, routeName, err) {
    console.error(`${routeName} failed:`, err.message);
    res.status(500).json({ message: err.message });
}

function isEmbeddedExercise(exerciseRef) {
    return Boolean(
        exerciseRef &&
        typeof exerciseRef === "object" &&
        !Array.isArray(exerciseRef) &&
        ("type" in exerciseRef || "name" in exerciseRef || "duration" in exerciseRef)
    );
}

function toExerciseIdString(exerciseRef) {
    if (!exerciseRef || isEmbeddedExercise(exerciseRef)) {
        return null;
    }

    if (typeof exerciseRef === "string") {
        return mongoose.Types.ObjectId.isValid(exerciseRef) ? exerciseRef : null;
    }

    if (exerciseRef instanceof mongoose.Types.ObjectId) {
        return exerciseRef.toString();
    }

    if (exerciseRef && typeof exerciseRef === "object" && exerciseRef._id) {
        const fromObject = exerciseRef._id.toString();
        return mongoose.Types.ObjectId.isValid(fromObject) ? fromObject : null;
    }

    const fromString = exerciseRef.toString ? exerciseRef.toString() : null;
    return fromString && mongoose.Types.ObjectId.isValid(fromString) ? fromString : null;
}

async function fetchWorkoutsWithExercises() {
    // Return workouts with full exercise objects so the frontend can read fields directly.
    const workouts = await db.Workout.find({})
        .sort({ day: 1 })
        .lean();

    const idSet = new Set();
    workouts.forEach(workout => {
        (workout.exercises || []).forEach(exerciseRef => {
            const id = toExerciseIdString(exerciseRef);
            if (id) {
                idSet.add(id);
            }
        });
    });

    const exerciseIds = Array.from(idSet).map(id => mongoose.Types.ObjectId(id));
    const exercises = exerciseIds.length
        ? await db.Exercise.find({ _id: { $in: exerciseIds } }).lean()
        : [];
    const exerciseMap = new Map(exercises.map(exercise => [exercise._id.toString(), exercise]));

    return workouts.map(workout => ({
        ...workout,
        exercises: (workout.exercises || [])
            .map(exerciseRef => {
                if (isEmbeddedExercise(exerciseRef)) {
                    return exerciseRef;
                }
                const id = toExerciseIdString(exerciseRef);
                return id ? exerciseMap.get(id) || null : null;
            })
            .filter(Boolean)
    }));
}

router.get("/api/workouts", (req, res) => {
    fetchWorkoutsWithExercises()
        .then(dbWorkout => {
            res.json(dbWorkout);
        })
        .catch(err => {
            sendRouteError(res, "GET /api/workouts", err);
        });
});

router.put("/api/workouts/:id", (req, res) => {
    db.Exercise.create(req.body)
        .then(({ _id }) => db.Workout.findOneAndUpdate(
            { _id: req.params.id },
            { $push: { exercises: _id } },
            { new: true }
        ))
        .then(dbWorkout => {
            if (!dbWorkout) {
                return res.status(404).json({ message: "Workout not found" });
            }
            res.json(dbWorkout);
        })
        .catch(err => {
            sendRouteError(res, "PUT /api/workouts/:id", err);
        });
});

router.post("/api/workouts", (req, res) => {
    db.Workout.create(req.body)
        .then(dbWorkout => {
            res.json(dbWorkout);
        })
        .catch(err => {
            sendRouteError(res, "POST /api/workouts", err);
        });
});

router.get("/api/workouts/range", (req, res) => {
    fetchWorkoutsWithExercises()
        .then(dbWorkout => {
            res.json(dbWorkout);
        })
        .catch(err => {
            sendRouteError(res, "GET /api/workouts/range", err);
        });
});

module.exports = router;

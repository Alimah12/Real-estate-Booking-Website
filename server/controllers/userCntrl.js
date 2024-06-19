import { prisma } from '../config/prismaConfig.js';
import asyncHandler from 'express-async-handler';

// Create a user
const createUser = asyncHandler(async (req, res) => {
    console.log("Creating a user");

    let { email } = req.body;

    const userExists = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!userExists) {
        const user = await prisma.user.create({
            data: req.body,
        });
        res.status(201).send({
            message: "User created successfully",
            user: user,
        });
    } else {
        res.status(200).send({
            message: "User already exists",
        });
    }
});

// Book a visit for residency
const bookVisit = asyncHandler(async (req, res) => {
    const { email, date } = req.body;
    const { id } = req.params;

    try {
        const alreadyBooked = await prisma.user.findUnique({
            where: { email },
            select: { bookedVisits: true }
        });

        if (alreadyBooked.bookedVisits.some((visit) => visit.id === id)) {
            res.status(400).json({ message: "Already booked" });
        } else {
            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    bookedVisits: {
                        set: [...alreadyBooked.bookedVisits, { id, date }]
                    },
                },
            });
            res.status(200).send({ message: "Booked successfully", user: updatedUser });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all bookings
const getAllBookings = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const bookings = await prisma.user.findUnique({
            where: { email },
            select: { bookedVisits: true }
        });
        res.status(200).send(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel a booking
const cancelBooking = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { bookedVisits: true }
        });

        const index = user.bookedVisits.findIndex((visit) => visit.id === id);

        if (index === -1) {
            res.status(400).json({ message: "Not booked" });
        } else {
            const updatedVisits = user.bookedVisits.filter((visit) => visit.id !== id);
            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    bookedVisits: { set: updatedVisits }
                }
            });
            res.status(200).send({ message: "Cancelled successfully", user: updatedUser });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add or remove favorite
const toFav = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { rid } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        let updatedFavs;

        if (user.favResidenciesID.includes(rid)) {
            updatedFavs = user.favResidenciesID.filter((id) => id !== rid);
            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    favResidenciesID: { set: updatedFavs }
                }
            });
            res.status(200).send({ message: "Removed from fav", user: updatedUser });
        } else {
            updatedFavs = [...user.favResidenciesID, rid];
            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    favResidenciesID: { set: updatedFavs }
                }
            });
            res.status(200).send({ message: "Added to fav", user: updatedUser });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all favorites
const getAllFav = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { favResidenciesID: true }
        });
        res.status(200).send(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export { createUser, bookVisit, getAllBookings, cancelBooking, toFav, getAllFav };

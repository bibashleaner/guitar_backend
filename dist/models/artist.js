import mongoose from "mongoose";
const SongSchema = new mongoose.Schema({
    title: String,
    chords: String,
    key: String,
    type: String,
    difficulty: String,
});
const ArtistSchema = new mongoose.Schema({
    name: String,
    songs: [SongSchema],
});
export const ArtistModel = mongoose.model('Artist', ArtistSchema);

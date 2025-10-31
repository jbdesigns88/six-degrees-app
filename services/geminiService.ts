
import { GoogleGenAI, Type } from "@google/genai";
import { Actor, ConnectionNodeData, Movie } from "../types";

// TMDB configuration
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZTk3NWQ1MzYwYjExNzdiMDdkOWJmOGEwNTc5NjBhMiIsIm5iZiI6MTc2MTg3NTczMS4zNjMwMDAyLCJzdWIiOiI2OTA0MTcxMzU2MDYyZjZlYzVmOTIwZDQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.N7GDSJ0oeqU7hvtr2_YTHplWOja5L7agChDqJmyw1UE';
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const tmdbFetch = async (endpoint: string) => {
    const url = `${TMDB_API_BASE_URL}${endpoint}`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
        }
    };
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`TMDB API request failed: ${response.statusText}`);
    }
    return response.json();
};

const constructImageUrl = (path: string | null) => {
    return path ? `${TMDB_IMAGE_BASE_URL}${path}` : `https://via.placeholder.com/500x750/1f2937/4b5563?text=No+Image`;
};

// Gemini JSON parsing helper
const parseJsonResponse = <T>(jsonString: string): T | null => {
    try {
        const sanitized = jsonString.trim().replace(/^```json/, '').replace(/```$/, '').trim();
        return JSON.parse(sanitized) as T;
    } catch (error) {
        console.error("Failed to parse JSON response:", error, "Raw response:", jsonString);
        return null;
    }
};

const getActorFromTmdb = async (name: string): Promise<Actor> => {
    const data = await tmdbFetch(`/search/person?query=${encodeURIComponent(name)}&include_adult=false&language=en-US&page=1`);
    const actorResult = data.results?.find((r: any) => r.known_for_department === 'Acting' && r.profile_path);

    if (!actorResult) {
        throw new Error(`Could not find actor "${name}" on TMDB.`);
    }

    return {
        id: actorResult.id,
        type: 'actor',
        name: actorResult.name,
        imageUrl: constructImageUrl(actorResult.profile_path),
    };
};

const getMovieFromTmdb = async (title: string): Promise<Movie> => {
    const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1`);
    const movieResult = data.results?.[0];
     if (!movieResult) {
        throw new Error(`Could not find movie "${title}" on TMDB.`);
    }
    return {
        id: movieResult.id,
        type: 'movie',
        title: movieResult.title,
        imageUrl: constructImageUrl(movieResult.poster_path),
    }
};

export const getActorById = async (id: number): Promise<Actor> => {
    const actorResult = await tmdbFetch(`/person/${id}?language=en-US`);
     if (!actorResult) {
        throw new Error(`Could not find actor with ID "${id}" on TMDB.`);
    }
    return {
        id: actorResult.id,
        type: 'actor',
        name: actorResult.name,
        imageUrl: constructImageUrl(actorResult.profile_path),
    }
};

export const getInitialActors = async (): Promise<{ start: Actor, target: Actor }> => {
    const prompt = `
        Generate two famous but distinct actors for a "Six Degrees of Separation" style game.
        Return their names in a JSON object. Example: {"start_actor_name": "Tom Hanks", "target_actor_name": "Zendaya"}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    start_actor_name: { type: Type.STRING },
                    target_actor_name: { type: Type.STRING },
                },
                required: ["start_actor_name", "target_actor_name"]
            }
        }
    });

    const nameResponse = parseJsonResponse<{ start_actor_name: string, target_actor_name: string }>(response.text);

    if (!nameResponse) {
        throw new Error("Failed to get initial actor names from Gemini API.");
    }
    
    // Fetch actor details from TMDB
    const [start, target] = await Promise.all([
        getActorFromTmdb(nameResponse.start_actor_name),
        getActorFromTmdb(nameResponse.target_actor_name)
    ]);
    
    return { start, target };
};


export const getChoices = async (node: ConnectionNodeData): Promise<ConnectionNodeData[]> => {
    if (node.type === 'actor') {
        const data = await tmdbFetch(`/person/${node.id}/movie_credits?language=en-US`);
        const movies: Movie[] = data.cast
            .filter((movie: any) => movie.poster_path)
            .sort((a: any, b: any) => b.popularity - a.popularity)
            .slice(0, 10) // Get top 10 popular movies
            .map((movie: any) => ({
                id: movie.id,
                type: 'movie',
                title: movie.title,
                imageUrl: constructImageUrl(movie.poster_path),
            }));
        return movies;
    } else { // node.type === 'movie'
        const data = await tmdbFetch(`/movie/${node.id}/credits?language=en-US`);
        const actors: Actor[] = data.cast
            .filter((person: any) => person.known_for_department === 'Acting' && person.profile_path)
            .sort((a: any, b: any) => b.popularity - a.popularity)
            .slice(0, 10) // Get top 10 popular actors
            .map((actor: any) => ({
                id: actor.id,
                type: 'actor',
                name: actor.name,
                imageUrl: constructImageUrl(actor.profile_path),
            }));
        return actors;
    }
};


export const getCpuMove = async (
    path: ConnectionNodeData[],
    choices: ConnectionNodeData[],
    target: Actor
): Promise<ConnectionNodeData | null> => {
    const currentPathString = path.map(p => p.type === 'actor' ? p.name : p.title).join(' -> ');
    const choicesString = choices.map(c => c.type === 'actor' ? c.name : c.title).join(', ');

    const prompt = `
        You are an AI playing a "Six Degrees of Separation" game.
        The goal is to connect the start actor to the target actor in as few steps as possible.

        Current Path: ${currentPathString}
        Target Actor: ${target.name}
        Available Choices: ${choicesString}

        Analyze the available choices and pick the one that is most likely to lead to the target actor in the fewest steps.
        Return only the name (for an actor) or title (for a movie) of your chosen item from the list. Do not add any explanation.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
    });

    const bestChoiceName = response.text.trim();
    
    const selectedChoice = choices.find(choice => {
        const name = choice.type === 'actor' ? choice.name : choice.title;
        return name.toLowerCase() === bestChoiceName.toLowerCase();
    });

    return selectedChoice || choices[Math.floor(Math.random() * choices.length)];
};

export const getSolutionPath = async (start: Actor, target: Actor): Promise<ConnectionNodeData[]> => {
    const prompt = `
        Find the shortest connection path between the actor "${start.name}" and the actor "${target.name}".
        The path must be an alternating sequence of actor and movie, starting and ending with an actor.
        For example: [Actor, Movie, Actor, Movie, Actor].
        Provide the result as a JSON array of objects, where each object has a "type" ('actor' or 'movie') and a "name".
        
        Example for connecting Tom Hanks to Kevin Bacon:
        [
            {"type": "actor", "name": "Tom Hanks"},
            {"type": "movie", "name": "Apollo 13"},
            {"type": "actor", "name": "Kevin Bacon"}
        ]
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['actor', 'movie'] },
                        name: { type: Type.STRING, description: "The actor's name or the movie's title." }
                    },
                    required: ['type', 'name']
                }
            }
        }
    });

    const parsedPath = parseJsonResponse<{ type: 'actor' | 'movie', name: string }[]>(response.text);

    if (!parsedPath || parsedPath.length === 0) {
        throw new Error("Could not find or parse solution path from Gemini.");
    }

    // Enrich the path with data from TMDB
    const enrichedPath = await Promise.all(parsedPath.map(async (node): Promise<ConnectionNodeData> => {
        try {
            if (node.type === 'actor') {
                return await getActorFromTmdb(node.name);
            } else {
                return await getMovieFromTmdb(node.name);
            }
        } catch (error) {
            console.warn(`Could not find TMDB data for "${node.name}". Using placeholder.`);
            const fallbackId = Date.now() + Math.random();
            return node.type === 'actor'
                ? { id: fallbackId, type: 'actor', name: node.name, imageUrl: constructImageUrl(null) }
                : { id: fallbackId, type: 'movie', title: node.name, imageUrl: constructImageUrl(null) };
        }
    }));

    return enrichedPath;
};

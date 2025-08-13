import fetch from 'node-fetch';
import { cache, CACHE_TTL } from './cache.js';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;

export async function makeTwitchRequest(url, accessToken, cacheKey = null) {
    if (cacheKey && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
        cache.delete(cacheKey);
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (cacheKey) {
            cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
        }
        
        return data;
    } catch (error) {
        console.error('Twitch API request error:', error);
        throw error;
    }
}

export async function batchGetUserInfo(userIds, accessToken) {
    if (!userIds || userIds.length === 0) return [];
    const batches = [];
    for (let i = 0; i < userIds.length; i += 100) {
        batches.push(userIds.slice(i, i + 100));
    }
    const allUsers = [];
    for (const batch of batches) {
        const userIdsParam = batch.join('&id=');
        const url = `https://api.twitch.tv/helix/users?id=${userIdsParam}`;
        const cacheKey = `users_${userIdsParam}`;
        try {
            const data = await makeTwitchRequest(url, accessToken, cacheKey);
            if (data.data) {
                allUsers.push(...data.data);
            }
        } catch (error) {
            console.error('Error fetching batch user info:', error);
        }
    }
    return allUsers;
}

export async function batchGetStreamStatus(userIds, accessToken) {
    if (!userIds || userIds.length === 0) return {};
    const userIdsParam = userIds.join('&user_id=');
    const url = `https://api.twitch.tv/helix/streams?user_id=${userIdsParam}`;
    const cacheKey = `streams_${userIdsParam}`;
    try {
        const data = await makeTwitchRequest(url, accessToken, cacheKey);
        const liveStatus = {};
        if (data.data) {
            data.data.forEach(stream => {
                liveStatus[stream.user_id] = true;
            });
        }
        return liveStatus;
    } catch (error) {
        console.error('Error fetching batch stream status:', error);
        return {};
    }
}


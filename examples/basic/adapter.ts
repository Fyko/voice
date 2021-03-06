import { DiscordGatewayAdapterCreator, DiscordGatewayAdapterLibraryMethods } from '../../';
import { VoiceChannel, Snowflake, Client, Constants } from 'discord.js';
import {
	GatewayVoiceServerUpdateDispatchData,
	GatewayVoiceStateUpdateDispatchData,
} from 'discord-api-types/v8/gateway';

const adapters = new Map<Snowflake, DiscordGatewayAdapterLibraryMethods>();
const trackedClients = new Set<Client>();

/**
 * Tracks a Discord.js client, listening to VOICE_SERVER_UPDATE and VOICE_STATE_UPDATE events.
 * @param client The Discord.js Client to track
 */
function trackClient(client: Client) {
	if (trackedClients.has(client)) return;
	trackedClients.add(client);
	client.ws.on(Constants.WSEvents.VOICE_SERVER_UPDATE, (payload: GatewayVoiceServerUpdateDispatchData) => {
		adapters.get(payload.guild_id)?.onVoiceServerUpdate(payload);
	});
	client.ws.on(Constants.WSEvents.VOICE_STATE_UPDATE, (payload: GatewayVoiceStateUpdateDispatchData) => {
		if (payload.guild_id && payload.session_id && payload.user_id === client.user?.id) {
			adapters.get(payload.guild_id)?.onVoiceStateUpdate(payload);
		}
	});
}

/**
 * Creates an adapter for a Voice Channel
 * @param channel The channel to create the adapter for
 */
export function createDiscordJSAdapter(channel: VoiceChannel): DiscordGatewayAdapterCreator {
	return (methods) => {
		adapters.set(channel.guild.id, methods);
		trackClient(channel.client);
		return {
			sendPayload(data) {
				return channel.guild.shard.send(data);
			},
			destroy() {
				return adapters.delete(channel.guild.id);
			},
		};
	};
}

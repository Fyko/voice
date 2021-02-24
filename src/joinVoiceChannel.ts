import { createVoiceConnection } from './VoiceConnection';
import { JoinConfig } from './DataStore';

/**
 * The options that can be given when joining a voice channel
 */
export interface JoinVoiceChannelOptions {
	/**
	 * The ID of the voice channel to join
	 */
	channelId: string;
	/**
	 * The ID of the guild the voice channel belongs to
	 */
	guildId: string;
	/**
	 * If true, debug messages will be enabled for the voice connection and its
	 * related components. Defaults to false.
	 */
	debug?: boolean;
}

/**
 * Creates a VoiceConnection to a Discord.js Voice Channel.
 *
 * @param voiceChannel - the voice channel to connect to
 * @param options - the options for joining the voice channel
 */
export function joinVoiceChannel(options: JoinVoiceChannelOptions) {
	const joinConfig: JoinConfig = {
		channelId: options.channelId,
		guildId: options.guildId,
		selfDeaf: true,
		selfMute: false,
	};

	return createVoiceConnection(joinConfig, { debug: false, ...options });
}

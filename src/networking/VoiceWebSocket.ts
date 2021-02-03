import { VoiceOPCodes } from 'discord-api-types/v8/gateway';
import WebSocket, { MessageEvent } from 'ws';

/**
 * An extension of the WebSocket class to provide helper functionality when interacting
 * with the Discord Voice gateway.
 */
export class VoiceWebSocket extends WebSocket {
	/**
	 * The current heartbeat interval, if any
	 */
	private heartbeatInterval?: NodeJS.Timeout;

	/**
	 * The time (milliseconds since UNIX epoch) that the last heartbeat acknowledgement packet was received.
	 * This is set to 0 if an acknowledgement packet hasn't been received yet.
	 */
	private lastHeartbeatAck: number;

	/**
	 * Creates a new VoiceWebSocket
	 * @param address The address to connect to
	 */
	public constructor(address: string) {
		super(address);
		this.lastHeartbeatAck = 0;
		this.onmessage = e => this.onMessage(e);
	}

	/**
	 * Destroys the VoiceWebSocket. The heartbeat interval is cleared, and the connection is closed.
	 */
	public destroy() {
		try {
			this.setHeartbeatInterval(-1);
			this.close(1000);
		} catch (error) {
			this.emit('error', error);
		}
	}

	/**
	 * Handles message events on the WebSocket. Attempts to JSON parse the messages and emit them
	 * as packets.
	 *
	 * @param event The message event
	 */
	public onMessage(event: MessageEvent) {
		if (typeof event.data !== 'string') return;

		let packet: any;
		try {
			packet = JSON.parse(event.data);
		} catch (error) {
			this.emit('error', error);
			return;
		}

		if (packet.op === VoiceOPCodes.HeartbeatAck) {
			this.lastHeartbeatAck = Date.now();
		}

		/**
		 * Packet event.
		 *
		 * @event VoiceWebSocket#packet
		 * @type {any}
		 */
		this.emit('packet', packet);
	}

	/**
	 * Sends a JSON-stringifiable packet over the WebSocket
	 * @param packet The packet to send
	 */
	public sendPacket(packet: any) {
		// todo: catch error
		try {
			return this.send(JSON.stringify(packet));
		} catch (error) {
			this.emit('error', error);
		}
	}

	/**
	 * Sends a heartbeat over the WebSocket
	 */
	private sendHeartbeat() {
		const nonce = Date.now();
		return this.sendPacket({
			op: VoiceOPCodes.Heartbeat,
			d: nonce
		});
	}

	/**
	 * Sets/clears an interval to send heartbeats over the WebSocket
	 * @param ms The interval in milliseconds. If negative, the interval will be unset.
	 */
	public setHeartbeatInterval(ms: number) {
		if (typeof this.heartbeatInterval !== 'undefined') clearInterval(this.heartbeatInterval);
		if (ms > 0) {
			this.heartbeatInterval = setInterval(() => {
				if (this.lastHeartbeatAck !== 0 && Date.now() - this.lastHeartbeatAck >= 3 * ms) {
					// Missed too many heartbeats - disconnect
					this.close();
				}
				this.sendHeartbeat();
			}, ms);
		}
	}
}
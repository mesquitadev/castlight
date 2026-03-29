import ciao from "@homebridge/ciao";
import { SIDECAR_PORT, MDNS_SERVICE_NAME } from "@castlight/shared";
import { networkInterfaces } from "os";

let responder: ciao.CiaoService | null = null;

export function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

export async function publishService(port: number = SIDECAR_PORT): Promise<void> {
  const ciaoInstance = ciao.getResponder();
  const service = ciaoInstance.createService({
    name: MDNS_SERVICE_NAME,
    type: ciao.Protocol.TCP,
    port,
    txt: {
      version: "0.1.0",
      ip: getLocalIP(),
    },
  });
  responder = service;
  await service.advertise();
  console.log(`[mdns] published ${MDNS_SERVICE_NAME} on port ${port}`);
}

export async function unpublishService(): Promise<void> {
  if (responder) {
    await responder.end();
    responder = null;
    console.log("[mdns] service unpublished");
  }
}

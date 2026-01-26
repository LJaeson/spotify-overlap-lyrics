import { execSync } from 'child_process';
import { BrowserWindow} from 'electron';
/**
 * Detects the active macOS Network Service name (e.g., 'Wi-Fi' or 'Ethernet')
 * by mapping the default route interface to the service order list.
 */
export function getActiveServiceName(): string | null{
  try {
    // 1. Get the primary interface (e.g., en0)
    const routeOutput = execSync('route -n get default').toString();
    const interfaceMatch = routeOutput.match(/interface:\s+(\w+)/);
    
    if (!interfaceMatch) return null;
    const targetDevice = interfaceMatch[1];

    // 2. Map device to Service Name
    const orderOutput = execSync('networksetup -listnetworkserviceorder').toString();
    
    // Split by the pattern (1), (2), etc. to isolate each service block
    const chunks = orderOutput.split(/\(\d+\)\s+/);
    
    for (const chunk of chunks) {
      if (chunk.includes(`Device: ${targetDevice}`)) {
        // The service name is the first line of the chunk
        let serviceName = chunk.split('\n')[0].replace('Hardware Port: ', '').trim();
        
        // Clean up: remove trailing info like "(Hardware Port: Wi-Fi, Device: en0)"
        serviceName = serviceName.split(' (Hardware Port')[0].trim();
        return serviceName;
      }
    }

    return null;

  } catch (error) {
    console.error(`Error detecting service: ${error}`);
  }
  
  return null;
}

export function getAllNetworkServiceNames(): string[] {
  try {
    const output = execSync('networksetup -listnetworkserviceorder').toString();

    const regex = /\(\d+\)\s+(.+)\n/g;
    const services: string[] = [];
    let match;

    while ((match = regex.exec(output)) !== null) {
      // The service name is in the first capture group
      services.push(match[1].trim());
    }

    return services;
  } catch (error) {
    console.error("Error fetching network services:", error);
    return [];
  }
}

export const showNativeLoading = () => {
  const loader = new BrowserWindow({
    width: 280,
    height: 120,
    frame: false,           // Native Mac "Frameless" look
    transparent: true,      // Allows for rounded corners
    alwaysOnTop: true,      // Keeps it above the main app
    resizable: false,
    hasShadow: true,
    center: true,
    webPreferences: { devTools: false }
  });

  // Native-looking CSS (frosted glass effect)
  const html = `
    <body style="margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
      <div style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); width: 100%; height: 100%; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 0.5px solid rgba(0,0,0,0.1);">
        <div style="font-weight: 600; font-size: 14px; color: #333;">Updating Proxy</div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">Please wait...</div>
      </div>
    </body>
  `;
  
  loader.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return loader;
};

// console.log(getActiveServiceName());

// /**
//  * Disables the Web Proxy and Secure Web Proxy for the active service.
//  */
// function unsetWebProxy(): void {
//   const service = getActiveServiceName();
  
//   if (!service) {
//     console.error("Could not find an active network service to unset proxy.");
//     return;
//   }

//   try {
//     console.log(`Unsetting proxy for: ${service}...`);
//     execSync(`networksetup -setwebproxystate "${service}" off`);
//     execSync(`networksetup -setsecurewebproxystate "${service}" off`);
//     console.log("Proxy disabled successfully.");
//   } catch (error) {
//     console.error("Failed to unset proxy:", error);
//   }
// }
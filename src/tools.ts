import { execSync } from 'child_process';

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
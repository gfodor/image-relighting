var fs_src = `
    precision highp float;

    const vec3 diffuseColor = vec3(1.0, 1.0, 1.0); // Used as light color
    const vec3 specColor = vec3(1.0, 1.0, 1.0);

    uniform vec3 lightPos;
    uniform sampler2D texSampler; // Albedo texture
    uniform sampler2D normalSampler; // Add normal map sampler
    uniform int textureLighting;
    uniform float lightIntensity;
    uniform float ambientIntensity; // New uniform for ambient light
    uniform sampler2D lightMapSampler; // Baked light map texture
    uniform float lightMapIntensity; // Intensity of the baked light map

    varying vec3 fPos;
    varying vec3 fNormal;
    varying vec2 texCoords;

    vec3 normal;

    vec3 calculate_lighting() {
        vec3 lightDir = fPos - lightPos;
        float distance = length(lightDir);
        if (distance >= 1.0) {
            distance = distance * distance;
        } else {
            distance = pow(distance, 0.5);
        }
        lightDir = normalize(lightDir);
    
        float lambertian = max(dot(lightDir, normal), 0.0);
        vec3 diffuse = diffuseColor * lambertian / distance; // diffuseColor here acts as the light's color

        // float specularCoeff = 0.0;
        // if (lambertian > 0.0) {
        //     vec3 viewDir = normalize(fPos);
        //     vec3 halfDir = normalize(lightDir + viewDir);
        //
        //     float specAngle = max(dot(halfDir, normal), 0.0);
        //     specularCoeff = pow(specAngle, 1.0);
        // }
        // vec3 specular = specularCoeff * specColor / distance;

        return diffuse; // Return only the diffuse component
    }

    void main() {
        // normal = normalize(fNormal); // Old: use geometric normal
        vec3 normalMapValue = texture2D(normalSampler, texCoords).rgb;
        normal = normalize(normalMapValue * 2.0 - 1.0); // New: use normal from map, remap from [0,1] to [-1,1]
        
        vec3 diffuseLightingComponent = calculate_lighting();
        vec4 texColor = texture2D(texSampler, texCoords); // texColor is the albedo
        
        vec4 finalFragColor = vec4(0.0, 0.0, 0.0, 1.0); // Default to black (for textureLighting == 0)

        if (textureLighting == 1) { // Texture only (unlit albedo)
            finalFragColor = texColor;
        } else if (textureLighting == 2) { // Lighting only (on default white surface)
            vec3 diffuseReflection = lightIntensity * diffuseLightingComponent;
            // Ambient light on a default white surface (diffuseColor is effectively white light color)
            vec3 ambientReflection = ambientIntensity * diffuseColor;
            finalFragColor = vec4(diffuseReflection + ambientReflection, 1.0);
        } else if (textureLighting == 3) { // Albedo (texture) + Lighting
            vec3 albedo = texColor.rgb;
            vec3 diffuseReflection = albedo * lightIntensity * diffuseLightingComponent;
            vec3 ambientReflection = albedo * ambientIntensity; // Assumes white ambient light source
            finalFragColor = vec4(diffuseReflection + ambientReflection, texColor.a);
        }
        
        // Incorporate baked light map
        vec3 bakedLight = texture2D(lightMapSampler, texCoords).rgb;
        finalFragColor.rgb = mix(finalFragColor.rgb, bakedLight, lightMapIntensity);

        gl_FragColor = finalFragColor;
    }
`;
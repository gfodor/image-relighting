var fs_src = `
    precision highp float;

    // const vec3 diffuseColor = vec3(1.0, 1.0, 1.0); // Used as light color - Replaced by u_lightColor
    const vec3 specColor = vec3(1.0, 1.0, 1.0);

    uniform vec3 lightPos;
    uniform sampler2D texSampler;       // Albedo texture
    uniform sampler2D normalSampler;    // Normal map sampler
    // uniform int textureLighting; // Removed
    uniform float lightIntensity;
    uniform float ambientIntensity;     // Ambient light intensity
    uniform sampler2D lightMapSampler;  // Baked light map texture
    uniform float lightMapIntensity;    // Baked light map blending intensity

    uniform vec3 u_lightColor;          // Light color uniform
    uniform float u_constantFalloff;    // Constant attenuation term
    uniform float u_linearFalloff;      // Linear attenuation term
    uniform float u_quadraticFalloff;   // Quadratic attenuation term

    // Uniforms for Light 2
    uniform vec3 lightPos2;
    uniform float lightIntensity2;
    uniform vec3 u_lightColor2;
    uniform float u_constantFalloff2;
    uniform float u_linearFalloff2;
    uniform float u_quadraticFalloff2;

    // Uniforms for enabled states
    uniform bool u_light1Enabled;
    uniform bool u_light2Enabled;
    uniform bool u_textureEnabled;

    varying vec3 fPos;
    varying vec3 fNormal;
    varying vec2 texCoords;

    vec3 normal;

    vec3 calculate_lighting(vec3 currentLightPos, vec3 currentLightColor, float currentLightIntensity, float constFalloff, float linFalloff, float quadFalloff) {
        // Vector from light to fragment
        vec3 lightToPointDir = fPos - currentLightPos;
        float distance = length(lightToPointDir);
        lightToPointDir = normalize(lightToPointDir);

        // Standard attenuation model: 1 / (c + l*d + q*d^2)
        float attenuation = 1.0 / (constFalloff + linFalloff * distance + quadFalloff * distance * distance);
        attenuation = max(0.0, attenuation);

        // Lambertian term
        float lambertian = max(dot(lightToPointDir, normal), 0.0);

        // Diffuse component, now includes intensity
        vec3 diffuse = currentLightColor * lambertian * attenuation * currentLightIntensity;

        // Specular (disabled by default)
        // float specularCoeff = 0.0;
        // if (lambertian > 0.0) {
        //     vec3 viewDir = normalize(fPos); // Actually should be normalize(-fPos) if camera at origin
        //     vec3 halfDir = normalize(lightToPointDir + viewDir);
        //     float specAngle = max(dot(halfDir, normal), 0.0);
        //     specularCoeff = pow(specAngle, 1.0);
        // }
        // vec3 specular = specularCoeff * specColor * attenuation;

        return diffuse;
    }

    void main() {
        // Use normal map
        vec3 normalMapValue = texture2D(normalSampler, texCoords).rgb;
        normal = normalize(normalMapValue * 2.0 - 1.0); // normal is global for calculate_lighting

        // Calculate total diffuse from enabled lights
        vec3 totalDiffuseContribution = vec3(0.0);
        if (u_light1Enabled) {
            totalDiffuseContribution += calculate_lighting(
                lightPos,
                u_lightColor,
                lightIntensity,
                u_constantFalloff,
                u_linearFalloff,
                u_quadraticFalloff
            );
        }
        if (u_light2Enabled) {
            totalDiffuseContribution += calculate_lighting(
                lightPos2,
                u_lightColor2,
                lightIntensity2,
                u_constantFalloff2,
                u_linearFalloff2,
                u_quadraticFalloff2
            );
        }

        vec4 texColor = texture2D(texSampler, texCoords);
        vec3 effectiveAlbedo = u_textureEnabled ? texColor.rgb : vec3(1.0); // Use white if texture is disabled

        vec3 finalLitColor;

        // Ambient component color is tied to light1's color, as per original implicit behavior.
        // A dedicated u_ambientColor uniform would be a good future improvement.
        vec3 ambientLightColorSource = u_lightColor;
        vec3 ambientComponent = effectiveAlbedo * ambientIntensity * ambientLightColorSource;
        vec3 diffuseComponent = effectiveAlbedo * totalDiffuseContribution; // totalDiffuseContribution already has intensity from each light

        if (u_light1Enabled || u_light2Enabled) {
            // If any dynamic light is on, combine diffuse and ambient
            finalLitColor = diffuseComponent + ambientComponent;
        } else {
            // No dynamic lights are on.
            // Scene is lit by ambient light. If ambientIntensity is also zero, then the scene is unlit (just albedo).
            if (ambientIntensity > 0.0) {
                finalLitColor = ambientComponent; // Lit by ambient only
            } else {
                finalLitColor = effectiveAlbedo; // Unlit (neither dynamic nor ambient active)
            }
        }

        // Incorporate baked light map
        vec3 bakedLight = texture2D(lightMapSampler, texCoords).rgb;
        vec4 finalFragColor = vec4(mix(finalLitColor, bakedLight, lightMapIntensity), texColor.a);

        gl_FragColor = finalFragColor;
    }
`;
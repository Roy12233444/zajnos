varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uMouse;
uniform float uHover;

void main() {
    float blocks = 20.0;
    vec2 blockUv = floor(vUv * blocks) / blocks;
    float distance = length(blockUv - uMouse);
    float effect = smoothstep(0.4, 0.0, distance);
    vec2 distortion = vec2(0.03)*effect;
    
    // Apply the distortion effect to the UV coordinates
    vec2 distortedUv = vUv + distortion*uHover;
    vec4 color = texture2D(uTexture, distortedUv);
    
    gl_FragColor = color;
}

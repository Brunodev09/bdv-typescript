namespace BdvEngine {
    export class transform {
        public position: vec3 = vec3.zero;
        public rotation: vec3 = vec3.zero;
        public scale: vec3 = vec3.one;

        public copyFrom(transform: transform): void {
            this.position.copyFrom(transform.position);
            this.rotation.copyFrom(transform.rotation);
            this.scale.copyFrom(transform.scale);
        }

        public getTransformationMatrix(): m4x4 {
            let translation = m4x4.translation(this.position);
            let rotation = m4x4.rotationXYZ(this.rotation.vx, this.rotation.vy, this.rotation.vz);
            let scale = m4x4.scale(this.scale);

            // T * R * S
            return m4x4.multiply(m4x4.multiply(translation, rotation), scale);
        }
    }
}

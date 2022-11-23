type TRange = {
    from: number;
    to: number;
};

export type TRateLimit = {
    intervalMS: number;
    maxLimit: number;
    maxWeight?: number;
};

export default class RateLimit {
    private readonly intervalMS: number = 0;
    private readonly maxLimit: number = 0;
    private readonly maxWeight: number = 0;
    private multiplier: number = 0;
    private queueCount: number = 0;
    private queueDone: number = 0;
    private queueRanges: TRange[] = [];
    private queueWeight: number = 0;

    public constructor(rate: TRateLimit) {
        this.intervalMS = rate.intervalMS;
        this.maxLimit = rate.maxLimit;
        if (rate.maxWeight) this.maxWeight = rate.maxWeight;
    }

    private CalculateRange(): void {
        // push queue range every first request of every batch
        if (this.queueCount === 1) {
            const rangeLength: number = this.queueRanges.length;
            const from: number = rangeLength
                ? this.queueRanges[rangeLength - 1].to + 1
                : Date.now();
            const to: number = from + this.intervalMS;
            this.queueRanges.push({ from, to });
        }
    }

    private CalculateWaitTime(range: TRange): number {
        // calculate wait time based on the last queue range
        const ts: number = Date.now();
        const { from, to } = range;
        let waitTime: number;
        if (from <= ts && ts <= to) {
            waitTime = 0;
        }
        else {
            waitTime = from - ts;
        }

        if (waitTime < 0) {
            const error: any = new Error(`'${waitTime}' is invalid`);
            error.data = {
                from,
                to,
                waitTime,
            };

            throw error;
        }

        return waitTime;
    }

    private CheckRange(): void {
        // reset in case the range had already passed
        const rangeLength: number = this.queueRanges.length;
        if (rangeLength) {
            const { to } = this.queueRanges[rangeLength - 1];
            const ts: number = Date.now();

            if (to < ts) {
                this.queueCount = 0;
                this.queueDone = 0;
                this.queueWeight = 0;
                this.queueRanges.length = 0;
                this.multiplier = 0;
            }
        }
    }

    private Decrease(): void {
        this.queueDone++;
        if (this.queueDone >= this.maxLimit) {
            this.multiplier--;

            // do not remove last element
            // this will be basis of next first element
            if (this.queueRanges.length > 1) {
                this.queueRanges.shift();
            }

            if (this.multiplier < 0) {
                this.multiplier = 0;
            }
            if (this.multiplier > 0) {
                this.queueCount = this.maxLimit;
                this.queueWeight = this.maxWeight;
            }
        }
    }

    private Increase(weight: number): void {
        this.queueCount++;
        this.queueWeight += weight;
        if (this.IsOverMax()) {
            this.multiplier++;
            this.queueCount = 1;
            this.queueWeight = weight;
        }
    }

    private IsOverMax(): boolean {
        const isOverLimit: boolean = this.queueCount > this.maxLimit
            ? true
            : false;

        const isOverWeight: boolean = this.maxWeight && this.queueWeight > this.maxWeight
            ? true
            : false;

        return isOverLimit || isOverWeight;
    }

    public async Check(weight: number = 1): Promise<number> {
        if (this.maxWeight && weight > this.maxWeight) throw new Error("Weight cannot be more than max weight");

        this.CheckRange();
        this.Increase(weight);
        this.CalculateRange();
        const waitTime: number = this.CalculateWaitTime(this.queueRanges[this.queueRanges.length - 1]);
        await new Promise((resolve: (value: unknown) => void) => {
            setTimeout(resolve, waitTime);
        });
        this.Decrease();
        return waitTime;
    }
}

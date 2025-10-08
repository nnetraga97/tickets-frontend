export class ETagCache<T>{
    private map = new Map<string, {etag?: string; body: T}>();
    get(key: string){
        return this.map.get(key);
    }
    set(key: string, v: {etag?: string, body: T}){
        this.map.set(key,v);
    }
}
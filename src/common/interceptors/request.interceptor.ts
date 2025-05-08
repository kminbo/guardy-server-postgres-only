import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { camelCase, mapKeys } from "lodash";

@Injectable()
export class RequestTransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        if (request.body) {
            request.body = this.toCamelCase(request.body);
        }
        if (request.query) {
            Object.assign(request.query, this.toCamelCase(request.query));
        }
        if (request.params) {
            Object.assign(request.params, this.toCamelCase(request.params));
        }

        return next.handle();
    }

    private toCamelCase(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this.toCamelCase(v));
        } else if (obj !== null && typeof obj === 'object') {
            return mapKeys(obj, (_v, k) => camelCase(k));   
        }
        return obj;
    }
}
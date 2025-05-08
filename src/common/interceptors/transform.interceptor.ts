//response 데이터를 카멜케이스로 변환
import { CallHandler, NestInterceptor, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs";
import { snakeCase } from "lodash";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                return this.toSnakeCase(data);
            }),
        );
    }

    private toSnakeCase(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this.toSnakeCase(v));
        }
        else if (obj !== null && obj.constructor === Object) {
            return Object.keys(obj).reduce((result, key)=> {
                result[snakeCase(key)] = this.toSnakeCase(obj[key]);
                return result;
            }, {});
        }
        return obj;
    }
}

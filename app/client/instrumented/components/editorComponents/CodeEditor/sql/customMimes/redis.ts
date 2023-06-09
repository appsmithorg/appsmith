function cov_2l4e9zo66n() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/sql/customMimes/redis.ts";
  var hash = "a19f56bf091bf37414da2ffc862d6683dd6d3356";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/sql/customMimes/redis.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 25
        },
        end: {
          line: 8,
          column: 61
        }
      },
      "1": {
        start: {
          line: 10,
          column: 32
        },
        end: {
          line: 15,
          column: 1
        }
      },
      "2": {
        start: {
          line: 16,
          column: 20
        },
        end: {
          line: 16,
          column: 61
        }
      },
      "3": {
        start: {
          line: 19,
          column: 0
        },
        end: {
          line: 22,
          column: 2
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "a19f56bf091bf37414da2ffc862d6683dd6d3356"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2l4e9zo66n = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2l4e9zo66n();
import CodeMirror from "codemirror";
import { merge } from "lodash";
import { EditorModes } from "../../EditorConfig";
import { getSqlMimeFromMode } from "../config";
import { spaceSeparatedStringToObject } from "./utils";

// @ts-expect-error: No type available
const defaultSQLConfig = (cov_2l4e9zo66n().s[0]++, CodeMirror.resolveMode("text/x-sql"));
export const redisKeywordsMap = (cov_2l4e9zo66n().s[1]++, {
  // https://redis.io/commands/
  keywords: spaceSeparatedStringToObject("acl cat deluser dryrun genpass getuser list load log save setuser users whoami append asking auth bf.add bf.card bf.exists bf.info bf.insert bf.loadchunk bf.madd bf.mexists bf.reserve bf.scandump bgrewriteaof bgsave bitcount bitfield bitfield_ro bitop bitpos blmove blmpop blpop brpop brpoplpush bzmpop bzpopmax bzpopmin cf.add cf.addnx cf.count cf.del cf.exists cf.info cf.insert cf.insertnx cf.loadchunk cf.mexists cf.reserve cf.scandump client caching getname getredir id info kill no-evict no-touch pause reply setinfo setname tracking trackinginfo unblock unpause cluster addslots addslotsrange bumpepoch count-failure-reports countkeysinslot delslots delslotsrange failover flushslots forget getkeysinslot keyslot links meet myid myshardid nodes replicas replicate reset saveconfig set-config-epoch setslot shards slaves slots cms.incrby cms.info cms.initbydim cms.initbyprob cms.merge cms.query command count docs getkeys getkeysandflags config get resetstat rewrite set copy dbsize decr decrby del discard dump echo eval eval_ro evalsha evalsha_ro exec exists expire expireat expiretime fcall fcall_ro flushall flushdb ft._list ft.aggregate ft.aliasadd ft.aliasdel ft.aliasupdate ft.alter ft.create ft.dictadd ft.dictdel ft.dictdump ft.dropindex ft.explain ft.explaincli ft.info ft.profile ft.search ft.spellcheck ft.sugadd ft.sugdel ft.sugget ft.suglen ft.syndump ft.synupdate ft.tagvals function delete flush restore stats geoadd geodist geohash geopos georadius georadius_ro georadiusbymember georadiusbymember_ro geosearch geosearchstore getbit getdel getex getrange getset graph.config graph.constraint create drop graph.delete graph.explain graph.list graph.profile graph.query graph.ro_query graph.slowlog hdel hello hexists hget hgetall hincrby hincrbyfloat hkeys hlen hmget hmset hrandfield hscan hset hsetnx hstrlen hvals incr incrby incrbyfloat json.arrappend json.arrindex json.arrinsert json.arrlen json.arrpop json.arrtrim json.clear json.debug json.del json.forget json.get json.mget json.numincrby json.nummultby json.objkeys json.objlen json.resp json.set json.strappend json.strlen json.toggle json.type keys lastsave latency doctor graph histogram history latest lcs lindex linsert llen lmove lmpop lolwut lpop lpos lpush lpushx lrange lrem lset ltrim mget migrate module loadex unload monitor move mset msetnx multi object encoding freq idletime refcount persist pexpire pexpireat pexpiretime pfadd pfcount pfdebug pfmerge pfselftest ping psetex psubscribe psync pttl publish pubsub channels numpat numsub shardchannels shardnumsub punsubscribe quit randomkey readonly readwrite rename renamenx replconf replicaof restore-asking role rpop rpoplpush rpush rpushx sadd scan scard script debug sdiff sdiffstore select setbit setex setnx setrange shutdown sinter sintercard sinterstore sismember slaveof slowlog len smembers smismember smove sort sort_ro spop spublish srandmember srem sscan ssubscribe strlen subscribe substr sunion sunionstore sunsubscribe swapdb sync tdigest.add tdigest.byrank tdigest.byrevrank tdigest.cdf tdigest.create tdigest.info tdigest.max tdigest.merge tdigest.min tdigest.quantile tdigest.rank tdigest.reset tdigest.revrank tdigest.trimmed_mean time topk.add topk.count topk.incrby topk.info topk.list topk.query topk.reserve touch ts.add ts.alter ts.create ts.createrule ts.decrby ts.del ts.deleterule ts.get ts.incrby ts.info ts.madd ts.mget ts.mrange ts.mrevrange ts.queryindex ts.range ts.revrange ttl type unlink unsubscribe unwatch wait waitaof watch xack xadd xautoclaim xclaim xdel xgroup createconsumer delconsumer destroy setid xinfo consumers groups stream xlen xpending xrange xread xreadgroup xrevrange xsetid xtrim zadd zcard zcount zdiff zdiffstore zincrby zinter zintercard zinterstore zlexcount zmpop zmscore zpopmax zpopmin zrandmember zrange zrangebylex zrangebyscore zrangestore zrank zrem zremrangebylex zremrangebyrank zremrangebyscore zrevrange zrevrangebylex zrevrangebyscore zrevrank zscan zscore zunion zunionstore")
});
const redisConfig = (cov_2l4e9zo66n().s[2]++, merge(defaultSQLConfig, redisKeywordsMap));

// Inspired by https://github.com/codemirror/codemirror5/blob/9974ded36bf01746eb2a00926916fef834d3d0d0/mode/sql/sql.js#L290
cov_2l4e9zo66n().s[3]++;
CodeMirror.defineMIME(getSqlMimeFromMode(EditorModes.REDIS_WITH_BINDING), redisConfig);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmw0ZTl6bzY2biIsImFjdHVhbENvdmVyYWdlIiwiQ29kZU1pcnJvciIsIm1lcmdlIiwiRWRpdG9yTW9kZXMiLCJnZXRTcWxNaW1lRnJvbU1vZGUiLCJzcGFjZVNlcGFyYXRlZFN0cmluZ1RvT2JqZWN0IiwiZGVmYXVsdFNRTENvbmZpZyIsInMiLCJyZXNvbHZlTW9kZSIsInJlZGlzS2V5d29yZHNNYXAiLCJrZXl3b3JkcyIsInJlZGlzQ29uZmlnIiwiZGVmaW5lTUlNRSIsIlJFRElTX1dJVEhfQklORElORyJdLCJzb3VyY2VzIjpbInJlZGlzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDb2RlTWlycm9yIGZyb20gXCJjb2RlbWlycm9yXCI7XG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IEVkaXRvck1vZGVzIH0gZnJvbSBcIi4uLy4uL0VkaXRvckNvbmZpZ1wiO1xuaW1wb3J0IHsgZ2V0U3FsTWltZUZyb21Nb2RlIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0IHsgc3BhY2VTZXBhcmF0ZWRTdHJpbmdUb09iamVjdCB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbi8vIEB0cy1leHBlY3QtZXJyb3I6IE5vIHR5cGUgYXZhaWxhYmxlXG5jb25zdCBkZWZhdWx0U1FMQ29uZmlnID0gQ29kZU1pcnJvci5yZXNvbHZlTW9kZShcInRleHQveC1zcWxcIik7XG5cbmV4cG9ydCBjb25zdCByZWRpc0tleXdvcmRzTWFwID0ge1xuICAvLyBodHRwczovL3JlZGlzLmlvL2NvbW1hbmRzL1xuICBrZXl3b3Jkczogc3BhY2VTZXBhcmF0ZWRTdHJpbmdUb09iamVjdChcbiAgICBcImFjbCBjYXQgZGVsdXNlciBkcnlydW4gZ2VucGFzcyBnZXR1c2VyIGxpc3QgbG9hZCBsb2cgc2F2ZSBzZXR1c2VyIHVzZXJzIHdob2FtaSBhcHBlbmQgYXNraW5nIGF1dGggYmYuYWRkIGJmLmNhcmQgYmYuZXhpc3RzIGJmLmluZm8gYmYuaW5zZXJ0IGJmLmxvYWRjaHVuayBiZi5tYWRkIGJmLm1leGlzdHMgYmYucmVzZXJ2ZSBiZi5zY2FuZHVtcCBiZ3Jld3JpdGVhb2YgYmdzYXZlIGJpdGNvdW50IGJpdGZpZWxkIGJpdGZpZWxkX3JvIGJpdG9wIGJpdHBvcyBibG1vdmUgYmxtcG9wIGJscG9wIGJycG9wIGJycG9wbHB1c2ggYnptcG9wIGJ6cG9wbWF4IGJ6cG9wbWluIGNmLmFkZCBjZi5hZGRueCBjZi5jb3VudCBjZi5kZWwgY2YuZXhpc3RzIGNmLmluZm8gY2YuaW5zZXJ0IGNmLmluc2VydG54IGNmLmxvYWRjaHVuayBjZi5tZXhpc3RzIGNmLnJlc2VydmUgY2Yuc2NhbmR1bXAgY2xpZW50IGNhY2hpbmcgZ2V0bmFtZSBnZXRyZWRpciBpZCBpbmZvIGtpbGwgbm8tZXZpY3Qgbm8tdG91Y2ggcGF1c2UgcmVwbHkgc2V0aW5mbyBzZXRuYW1lIHRyYWNraW5nIHRyYWNraW5naW5mbyB1bmJsb2NrIHVucGF1c2UgY2x1c3RlciBhZGRzbG90cyBhZGRzbG90c3JhbmdlIGJ1bXBlcG9jaCBjb3VudC1mYWlsdXJlLXJlcG9ydHMgY291bnRrZXlzaW5zbG90IGRlbHNsb3RzIGRlbHNsb3RzcmFuZ2UgZmFpbG92ZXIgZmx1c2hzbG90cyBmb3JnZXQgZ2V0a2V5c2luc2xvdCBrZXlzbG90IGxpbmtzIG1lZXQgbXlpZCBteXNoYXJkaWQgbm9kZXMgcmVwbGljYXMgcmVwbGljYXRlIHJlc2V0IHNhdmVjb25maWcgc2V0LWNvbmZpZy1lcG9jaCBzZXRzbG90IHNoYXJkcyBzbGF2ZXMgc2xvdHMgY21zLmluY3JieSBjbXMuaW5mbyBjbXMuaW5pdGJ5ZGltIGNtcy5pbml0Ynlwcm9iIGNtcy5tZXJnZSBjbXMucXVlcnkgY29tbWFuZCBjb3VudCBkb2NzIGdldGtleXMgZ2V0a2V5c2FuZGZsYWdzIGNvbmZpZyBnZXQgcmVzZXRzdGF0IHJld3JpdGUgc2V0IGNvcHkgZGJzaXplIGRlY3IgZGVjcmJ5IGRlbCBkaXNjYXJkIGR1bXAgZWNobyBldmFsIGV2YWxfcm8gZXZhbHNoYSBldmFsc2hhX3JvIGV4ZWMgZXhpc3RzIGV4cGlyZSBleHBpcmVhdCBleHBpcmV0aW1lIGZjYWxsIGZjYWxsX3JvIGZsdXNoYWxsIGZsdXNoZGIgZnQuX2xpc3QgZnQuYWdncmVnYXRlIGZ0LmFsaWFzYWRkIGZ0LmFsaWFzZGVsIGZ0LmFsaWFzdXBkYXRlIGZ0LmFsdGVyIGZ0LmNyZWF0ZSBmdC5kaWN0YWRkIGZ0LmRpY3RkZWwgZnQuZGljdGR1bXAgZnQuZHJvcGluZGV4IGZ0LmV4cGxhaW4gZnQuZXhwbGFpbmNsaSBmdC5pbmZvIGZ0LnByb2ZpbGUgZnQuc2VhcmNoIGZ0LnNwZWxsY2hlY2sgZnQuc3VnYWRkIGZ0LnN1Z2RlbCBmdC5zdWdnZXQgZnQuc3VnbGVuIGZ0LnN5bmR1bXAgZnQuc3ludXBkYXRlIGZ0LnRhZ3ZhbHMgZnVuY3Rpb24gZGVsZXRlIGZsdXNoIHJlc3RvcmUgc3RhdHMgZ2VvYWRkIGdlb2Rpc3QgZ2VvaGFzaCBnZW9wb3MgZ2VvcmFkaXVzIGdlb3JhZGl1c19ybyBnZW9yYWRpdXNieW1lbWJlciBnZW9yYWRpdXNieW1lbWJlcl9ybyBnZW9zZWFyY2ggZ2Vvc2VhcmNoc3RvcmUgZ2V0Yml0IGdldGRlbCBnZXRleCBnZXRyYW5nZSBnZXRzZXQgZ3JhcGguY29uZmlnIGdyYXBoLmNvbnN0cmFpbnQgY3JlYXRlIGRyb3AgZ3JhcGguZGVsZXRlIGdyYXBoLmV4cGxhaW4gZ3JhcGgubGlzdCBncmFwaC5wcm9maWxlIGdyYXBoLnF1ZXJ5IGdyYXBoLnJvX3F1ZXJ5IGdyYXBoLnNsb3dsb2cgaGRlbCBoZWxsbyBoZXhpc3RzIGhnZXQgaGdldGFsbCBoaW5jcmJ5IGhpbmNyYnlmbG9hdCBoa2V5cyBobGVuIGhtZ2V0IGhtc2V0IGhyYW5kZmllbGQgaHNjYW4gaHNldCBoc2V0bnggaHN0cmxlbiBodmFscyBpbmNyIGluY3JieSBpbmNyYnlmbG9hdCBqc29uLmFycmFwcGVuZCBqc29uLmFycmluZGV4IGpzb24uYXJyaW5zZXJ0IGpzb24uYXJybGVuIGpzb24uYXJycG9wIGpzb24uYXJydHJpbSBqc29uLmNsZWFyIGpzb24uZGVidWcganNvbi5kZWwganNvbi5mb3JnZXQganNvbi5nZXQganNvbi5tZ2V0IGpzb24ubnVtaW5jcmJ5IGpzb24ubnVtbXVsdGJ5IGpzb24ub2Jqa2V5cyBqc29uLm9iamxlbiBqc29uLnJlc3AganNvbi5zZXQganNvbi5zdHJhcHBlbmQganNvbi5zdHJsZW4ganNvbi50b2dnbGUganNvbi50eXBlIGtleXMgbGFzdHNhdmUgbGF0ZW5jeSBkb2N0b3IgZ3JhcGggaGlzdG9ncmFtIGhpc3RvcnkgbGF0ZXN0IGxjcyBsaW5kZXggbGluc2VydCBsbGVuIGxtb3ZlIGxtcG9wIGxvbHd1dCBscG9wIGxwb3MgbHB1c2ggbHB1c2h4IGxyYW5nZSBscmVtIGxzZXQgbHRyaW0gbWdldCBtaWdyYXRlIG1vZHVsZSBsb2FkZXggdW5sb2FkIG1vbml0b3IgbW92ZSBtc2V0IG1zZXRueCBtdWx0aSBvYmplY3QgZW5jb2RpbmcgZnJlcSBpZGxldGltZSByZWZjb3VudCBwZXJzaXN0IHBleHBpcmUgcGV4cGlyZWF0IHBleHBpcmV0aW1lIHBmYWRkIHBmY291bnQgcGZkZWJ1ZyBwZm1lcmdlIHBmc2VsZnRlc3QgcGluZyBwc2V0ZXggcHN1YnNjcmliZSBwc3luYyBwdHRsIHB1Ymxpc2ggcHVic3ViIGNoYW5uZWxzIG51bXBhdCBudW1zdWIgc2hhcmRjaGFubmVscyBzaGFyZG51bXN1YiBwdW5zdWJzY3JpYmUgcXVpdCByYW5kb21rZXkgcmVhZG9ubHkgcmVhZHdyaXRlIHJlbmFtZSByZW5hbWVueCByZXBsY29uZiByZXBsaWNhb2YgcmVzdG9yZS1hc2tpbmcgcm9sZSBycG9wIHJwb3BscHVzaCBycHVzaCBycHVzaHggc2FkZCBzY2FuIHNjYXJkIHNjcmlwdCBkZWJ1ZyBzZGlmZiBzZGlmZnN0b3JlIHNlbGVjdCBzZXRiaXQgc2V0ZXggc2V0bnggc2V0cmFuZ2Ugc2h1dGRvd24gc2ludGVyIHNpbnRlcmNhcmQgc2ludGVyc3RvcmUgc2lzbWVtYmVyIHNsYXZlb2Ygc2xvd2xvZyBsZW4gc21lbWJlcnMgc21pc21lbWJlciBzbW92ZSBzb3J0IHNvcnRfcm8gc3BvcCBzcHVibGlzaCBzcmFuZG1lbWJlciBzcmVtIHNzY2FuIHNzdWJzY3JpYmUgc3RybGVuIHN1YnNjcmliZSBzdWJzdHIgc3VuaW9uIHN1bmlvbnN0b3JlIHN1bnN1YnNjcmliZSBzd2FwZGIgc3luYyB0ZGlnZXN0LmFkZCB0ZGlnZXN0LmJ5cmFuayB0ZGlnZXN0LmJ5cmV2cmFuayB0ZGlnZXN0LmNkZiB0ZGlnZXN0LmNyZWF0ZSB0ZGlnZXN0LmluZm8gdGRpZ2VzdC5tYXggdGRpZ2VzdC5tZXJnZSB0ZGlnZXN0Lm1pbiB0ZGlnZXN0LnF1YW50aWxlIHRkaWdlc3QucmFuayB0ZGlnZXN0LnJlc2V0IHRkaWdlc3QucmV2cmFuayB0ZGlnZXN0LnRyaW1tZWRfbWVhbiB0aW1lIHRvcGsuYWRkIHRvcGsuY291bnQgdG9way5pbmNyYnkgdG9way5pbmZvIHRvcGsubGlzdCB0b3BrLnF1ZXJ5IHRvcGsucmVzZXJ2ZSB0b3VjaCB0cy5hZGQgdHMuYWx0ZXIgdHMuY3JlYXRlIHRzLmNyZWF0ZXJ1bGUgdHMuZGVjcmJ5IHRzLmRlbCB0cy5kZWxldGVydWxlIHRzLmdldCB0cy5pbmNyYnkgdHMuaW5mbyB0cy5tYWRkIHRzLm1nZXQgdHMubXJhbmdlIHRzLm1yZXZyYW5nZSB0cy5xdWVyeWluZGV4IHRzLnJhbmdlIHRzLnJldnJhbmdlIHR0bCB0eXBlIHVubGluayB1bnN1YnNjcmliZSB1bndhdGNoIHdhaXQgd2FpdGFvZiB3YXRjaCB4YWNrIHhhZGQgeGF1dG9jbGFpbSB4Y2xhaW0geGRlbCB4Z3JvdXAgY3JlYXRlY29uc3VtZXIgZGVsY29uc3VtZXIgZGVzdHJveSBzZXRpZCB4aW5mbyBjb25zdW1lcnMgZ3JvdXBzIHN0cmVhbSB4bGVuIHhwZW5kaW5nIHhyYW5nZSB4cmVhZCB4cmVhZGdyb3VwIHhyZXZyYW5nZSB4c2V0aWQgeHRyaW0gemFkZCB6Y2FyZCB6Y291bnQgemRpZmYgemRpZmZzdG9yZSB6aW5jcmJ5IHppbnRlciB6aW50ZXJjYXJkIHppbnRlcnN0b3JlIHpsZXhjb3VudCB6bXBvcCB6bXNjb3JlIHpwb3BtYXggenBvcG1pbiB6cmFuZG1lbWJlciB6cmFuZ2UgenJhbmdlYnlsZXggenJhbmdlYnlzY29yZSB6cmFuZ2VzdG9yZSB6cmFuayB6cmVtIHpyZW1yYW5nZWJ5bGV4IHpyZW1yYW5nZWJ5cmFuayB6cmVtcmFuZ2VieXNjb3JlIHpyZXZyYW5nZSB6cmV2cmFuZ2VieWxleCB6cmV2cmFuZ2VieXNjb3JlIHpyZXZyYW5rIHpzY2FuIHpzY29yZSB6dW5pb24genVuaW9uc3RvcmVcIixcbiAgKSxcbn07XG5jb25zdCByZWRpc0NvbmZpZyA9IG1lcmdlKGRlZmF1bHRTUUxDb25maWcsIHJlZGlzS2V5d29yZHNNYXApO1xuXG4vLyBJbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vY29kZW1pcnJvci9jb2RlbWlycm9yNS9ibG9iLzk5NzRkZWQzNmJmMDE3NDZlYjJhMDA5MjY5MTZmZWY4MzRkM2QwZDAvbW9kZS9zcWwvc3FsLmpzI0wyOTBcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcbiAgZ2V0U3FsTWltZUZyb21Nb2RlKEVkaXRvck1vZGVzLlJFRElTX1dJVEhfQklORElORyksXG4gIHJlZGlzQ29uZmlnLFxuKTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosT0FBT0UsVUFBVSxNQUFNLFlBQVk7QUFDbkMsU0FBU0MsS0FBSyxRQUFRLFFBQVE7QUFDOUIsU0FBU0MsV0FBVyxRQUFRLG9CQUFvQjtBQUNoRCxTQUFTQyxrQkFBa0IsUUFBUSxXQUFXO0FBQzlDLFNBQVNDLDRCQUE0QixRQUFRLFNBQVM7O0FBRXREO0FBQ0EsTUFBTUMsZ0JBQWdCLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHTixVQUFVLENBQUNPLFdBQVcsQ0FBQyxZQUFZLENBQUM7QUFFN0QsT0FBTyxNQUFNQyxnQkFBZ0IsSUFBQVYsY0FBQSxHQUFBUSxDQUFBLE9BQUc7RUFDOUI7RUFDQUcsUUFBUSxFQUFFTCw0QkFBNEIsQ0FDcEMsNDVIQUNGO0FBQ0YsQ0FBQztBQUNELE1BQU1NLFdBQVcsSUFBQVosY0FBQSxHQUFBUSxDQUFBLE9BQUdMLEtBQUssQ0FBQ0ksZ0JBQWdCLEVBQUVHLGdCQUFnQixDQUFDOztBQUU3RDtBQUFBVixjQUFBLEdBQUFRLENBQUE7QUFDQU4sVUFBVSxDQUFDVyxVQUFVLENBQ25CUixrQkFBa0IsQ0FBQ0QsV0FBVyxDQUFDVSxrQkFBa0IsQ0FBQyxFQUNsREYsV0FDRixDQUFDIn0=
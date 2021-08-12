/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

function Compressor(options, false_by_default) {
    if (!(this instanceof Compressor))
        return new Compressor(options, false_by_default);
    TreeTransformer.call(this, this.before, this.after);
    this.options = defaults(options, {
        annotations     : !false_by_default,
        arguments       : !false_by_default,
        arrows          : !false_by_default,
        assignments     : !false_by_default,
        awaits          : !false_by_default,
        booleans        : !false_by_default,
        collapse_vars   : !false_by_default,
        comparisons     : !false_by_default,
        conditionals    : !false_by_default,
        dead_code       : !false_by_default,
        default_values  : !false_by_default,
        directives      : !false_by_default,
        drop_console    : false,
        drop_debugger   : !false_by_default,
        evaluate        : !false_by_default,
        expression      : false,
        functions       : !false_by_default,
        global_defs     : false,
        hoist_exports   : !false_by_default,
        hoist_funs      : false,
        hoist_props     : !false_by_default,
        hoist_vars      : false,
        ie              : false,
        if_return       : !false_by_default,
        imports         : !false_by_default,
        inline          : !false_by_default,
        join_vars       : !false_by_default,
        keep_fargs      : false_by_default,
        keep_fnames     : false,
        keep_infinity   : false,
        loops           : !false_by_default,
        merge_vars      : !false_by_default,
        negate_iife     : !false_by_default,
        objects         : !false_by_default,
        optional_chains : !false_by_default,
        passes          : 1,
        properties      : !false_by_default,
        pure_funcs      : null,
        pure_getters    : !false_by_default && "strict",
        reduce_funcs    : !false_by_default,
        reduce_vars     : !false_by_default,
        rests           : !false_by_default,
        sequences       : !false_by_default,
        side_effects    : !false_by_default,
        spreads         : !false_by_default,
        strings         : !false_by_default,
        switches        : !false_by_default,
        templates       : !false_by_default,
        top_retain      : null,
        toplevel        : !!(options && options["top_retain"]),
        typeofs         : !false_by_default,
        unsafe          : false,
        unsafe_comps    : false,
        unsafe_Function : false,
        unsafe_math     : false,
        unsafe_proto    : false,
        unsafe_regexp   : false,
        unsafe_undefined: false,
        unused          : !false_by_default,
        varify          : !false_by_default,
        webkit          : false,
        yields          : !false_by_default,
    }, true);
    var evaluate = this.options["evaluate"];
    this.eval_threshold = /eager/.test(evaluate) ? 1 / 0 : +evaluate;
    var global_defs = this.options["global_defs"];
    if (typeof global_defs == "object") for (var key in global_defs) {
        if (/^@/.test(key) && HOP(global_defs, key)) {
            global_defs[key.slice(1)] = parse(global_defs[key], {
                expression: true
            });
        }
    }
    if (this.options["inline"] === true) this.options["inline"] = 3;
    this.drop_fargs = this.options["keep_fargs"] ? return_false : function(lambda, parent) {
        if (lambda.length_read) return false;
        var name = lambda.name;
        if (!name) return parent && parent.TYPE == "Call" && parent.expression === lambda;
        if (name.fixed_value() !== lambda) return false;
        var def = name.definition();
        if (def.direct_access) return false;
        var escaped = def.escaped;
        return escaped && escaped.depth != 1;
    };
    var pure_funcs = this.options["pure_funcs"];
    if (typeof pure_funcs == "function") {
        this.pure_funcs = pure_funcs;
    } else if (typeof pure_funcs == "string") {
        this.pure_funcs = function(node) {
            var expr;
            if (node instanceof AST_Call) {
                expr = node.expression;
            } else if (node instanceof AST_Template) {
                expr = node.tag;
            }
            return !(expr && pure_funcs === expr.print_to_string());
        };
    } else if (Array.isArray(pure_funcs)) {
        this.pure_funcs = function(node) {
            var expr;
            if (node instanceof AST_Call) {
                expr = node.expression;
            } else if (node instanceof AST_Template) {
                expr = node.tag;
            }
            return !(expr && member(expr.print_to_string(), pure_funcs));
        };
    } else {
        this.pure_funcs = return_true;
    }
    var sequences = this.options["sequences"];
    this.sequences_limit = sequences == 1 ? 800 : sequences | 0;
    var top_retain = this.options["top_retain"];
    if (top_retain instanceof RegExp) {
        this.top_retain = function(def) {
            return top_retain.test(def.name);
        };
    } else if (typeof top_retain == "function") {
        this.top_retain = top_retain;
    } else if (top_retain) {
        if (typeof top_retain == "string") {
            top_retain = top_retain.split(/,/);
        }
        this.top_retain = function(def) {
            return member(def.name, top_retain);
        };
    }
    var toplevel = this.options["toplevel"];
    this.toplevel = typeof toplevel == "string" ? {
        funcs: /funcs/.test(toplevel),
        vars: /vars/.test(toplevel)
    } : {
        funcs: toplevel,
        vars: toplevel
    };
}

Compressor.prototype = new TreeTransformer;
merge(Compressor.prototype, {
    option: function(key) { return this.options[key] },
    exposed: function(def) {
        if (def.exported) return true;
        if (def.undeclared) return true;
        if (!(def.global || def.scope.resolve() instanceof AST_Toplevel)) return false;
        var toplevel = this.toplevel;
        return !all(def.orig, function(sym) {
            return toplevel[sym instanceof AST_SymbolDefun ? "funcs" : "vars"];
        });
    },
    compress: function(node) {
        node = node.resolve_defines(this);
        node.hoist_exports(this);
        if (this.option("expression")) {
            node.process_expression(true);
        }
        var passes = +this.options.passes || 1;
        var min_count = 1 / 0;
        var stopping = false;
        var mangle = { ie: this.option("ie") };
        for (var pass = 0; pass < passes; pass++) {
            node.figure_out_scope(mangle);
            if (pass > 0 || this.option("reduce_vars"))
                node.reset_opt_flags(this);
            node = node.transform(this);
            if (passes > 1) {
                var count = 0;
                node.walk(new TreeWalker(function() {
                    count++;
                }));
                AST_Node.info("pass {pass}: last_count: {min_count}, count: {count}", {
                    pass: pass,
                    min_count: min_count,
                    count: count,
                });
                if (count < min_count) {
                    min_count = count;
                    stopping = false;
                } else if (stopping) {
                    break;
                } else {
                    stopping = true;
                }
            }
        }
        if (this.option("expression")) {
            node.process_expression(false);
        }
        return node;
    },
    before: function(node, descend, in_list) {
        if (node._squeezed) return node;
        var is_scope = node instanceof AST_Scope;
        if (is_scope) {
            node.hoist_properties(this);
            node.hoist_declarations(this);
            node.process_boolean_returns(this);
        }
        // Before https://github.com/mishoo/UglifyJS/pull/1602 AST_Node.optimize()
        // would call AST_Node.transform() if a different instance of AST_Node is
        // produced after OPT().
        // This corrupts TreeWalker.stack, which cause AST look-ups to malfunction.
        // Migrate and defer all children's AST_Node.transform() to below, which
        // will now happen after this parent AST_Node has been properly substituted
        // thus gives a consistent AST snapshot.
        descend(node, this);
        // Existing code relies on how AST_Node.optimize() worked, and omitting the
        // following replacement call would result in degraded efficiency of both
        // output and performance.
        descend(node, this);
        var opt = node.optimize(this);
        if (is_scope && opt === node && !this.has_directive("use asm") && !opt.pinned()) {
            opt.merge_variables(this);
            opt.drop_unused(this);
            descend(opt, this);
        }
        if (opt === node) opt._squeezed = true;
        return opt;
    }
});

(function(OPT) {
    OPT(AST_Node, function(self, compressor) {
        return self;
    });

    AST_Node.DEFMETHOD("equivalent_to", function(node) {
        return this.TYPE == node.TYPE && this.print_to_string() == node.print_to_string();
    });

    AST_Toplevel.DEFMETHOD("hoist_exports", function(compressor) {
        if (!compressor.option("hoist_exports")) return;
        var body = this.body, props = [];
        for (var i = 0; i < body.length; i++) {
            var stat = body[i];
            if (stat instanceof AST_ExportDeclaration) {
                body[i] = stat = stat.body;
                if (stat instanceof AST_Definitions) {
                    stat.definitions.forEach(function(defn) {
                        defn.name.match_symbol(export_symbol, true);
                    });
                } else {
                    export_symbol(stat.name);
                }
            } else if (stat instanceof AST_ExportReferences) {
                body.splice(i--, 1);
                [].push.apply(props, stat.properties);
            }
        }
        if (props.length) body.push(make_node(AST_ExportReferences, this, { properties: props }));

        function export_symbol(sym) {
            if (!(sym instanceof AST_SymbolDeclaration)) return;
            var node = make_node(AST_SymbolExport, sym, sym);
            node.alias = node.name;
            props.push(node);
        }
    });

    AST_Scope.DEFMETHOD("process_expression", function(insert, transform) {
        var self = this;
        var tt = new TreeTransformer(function(node) {
            if (insert && node instanceof AST_SimpleStatement) {
                return transform ? transform(node) : make_node(AST_Return, node, { value: node.body });
            }
            if (!insert && node instanceof AST_Return) {
                return transform ? transform(node) : make_node(AST_SimpleStatement, node, {
                    body: node.value || make_node(AST_UnaryPrefix, node, {
                        operator: "void",
                        expression: make_node(AST_Number, node, { value: 0 }),
                    }),
                });
            }
            if (node instanceof AST_Block) {
                if (node instanceof AST_Lambda) {
                    if (node !== self) return node;
                } else if (insert === "awaits" && node instanceof AST_Try) {
                    if (node.bfinally) return node;
                }
                for (var index = node.body.length; --index >= 0;) {
                    var stat = node.body[index];
                    if (!is_declaration(stat, true)) {
                        node.body[index] = stat.transform(tt);
                        break;
                    }
                }
            } else if (node instanceof AST_If) {
                node.body = node.body.transform(tt);
                if (node.alternative) {
                    node.alternative = node.alternative.transform(tt);
                }
            } else if (node instanceof AST_With) {
                node.body = node.body.transform(tt);
            }
            return node;
        });
        self.transform(tt);
    });

    function read_property(obj, node) {
        var key = node.get_property();
        if (key instanceof AST_Node) return;
        var value;
        if (obj instanceof AST_Array) {
            var elements = obj.elements;
            if (key == "length") return make_node_from_constant(elements.length, obj);
            if (typeof key == "number" && key in elements) value = elements[key];
        } else if (obj instanceof AST_Lambda) {
            if (key == "length") {
                obj.length_read = true;
                return make_node_from_constant(obj.argnames.length, obj);
            }
        } else if (obj instanceof AST_Object) {
            key = "" + key;
            var props = obj.properties;
            for (var i = props.length; --i >= 0;) {
                var prop = props[i];
                if (!can_hoist_property(prop)) return;
                if (!value && props[i].key === key) value = props[i].value;
            }
        }
        return value instanceof AST_SymbolRef && value.fixed_value() || value;
    }

    function is_read_only_fn(value, name) {
        if (value instanceof AST_Boolean) return native_fns.Boolean[name];
        if (value instanceof AST_Number) return native_fns.Number[name];
        if (value instanceof AST_String) return native_fns.String[name];
        if (name == "valueOf") return false;
        if (value instanceof AST_Array) return native_fns.Array[name];
        if (value instanceof AST_Lambda) return native_fns.Function[name];
        if (value instanceof AST_Object) return native_fns.Object[name];
        if (value instanceof AST_RegExp) return native_fns.RegExp[name] && !value.value.global;
    }

    function is_modified(compressor, tw, node, value, level, immutable, recursive) {
        var parent = tw.parent(level);
        if (compressor.option("unsafe") && parent instanceof AST_Dot && is_read_only_fn(value, parent.property)) {
            return;
        }
        var lhs = is_lhs(node, parent);
        if (lhs) return lhs;
        if (parent instanceof AST_Array) return is_modified(compressor, tw, parent, parent, level + 1);
        if (parent instanceof AST_Binary) {
            if (!lazy_op[parent.operator]) return;
            return is_modified(compressor, tw, parent, parent, level + 1);
        }
        if (parent instanceof AST_Call) {
            return !immutable
                && parent.expression === node
                && !parent.is_expr_pure(compressor)
                && (!(value instanceof AST_LambdaExpression) || !(parent instanceof AST_New) && value.contains_this());
        }
        if (parent instanceof AST_Conditional) {
            if (parent.condition === node) return;
            return is_modified(compressor, tw, parent, parent, level + 1);
        }
        if (parent instanceof AST_ForEnumeration) return parent.init === node;
        if (parent instanceof AST_ObjectKeyVal) {
            if (parent.value !== node) return;
            var obj = tw.parent(level + 1);
            return is_modified(compressor, tw, obj, obj, level + 2);
        }
        if (parent instanceof AST_PropAccess) {
            if (parent.expression !== node) return;
            var prop = read_property(value, parent);
            return (!immutable || recursive) && is_modified(compressor, tw, parent, prop, level + 1);
        }
        if (parent instanceof AST_Sequence) {
            if (parent.tail_node() !== node) return;
            return is_modified(compressor, tw, parent, value, level + 1, immutable, recursive);
        }
    }

    function is_lambda(node) {
        return node instanceof AST_Class || node instanceof AST_Lambda;
    }

    function safe_for_extends(node) {
        return node instanceof AST_Class || node instanceof AST_Defun || node instanceof AST_Function;
    }

    function is_arguments(def) {
        return def.name == "arguments" && def.scope.uses_arguments;
    }

    function is_funarg(def) {
        return def.orig[0] instanceof AST_SymbolFunarg || def.orig[1] instanceof AST_SymbolFunarg;
    }

    function cross_scope(def, sym) {
        do {
            if (def === sym) return false;
            if (sym instanceof AST_Scope) return true;
        } while (sym = sym.parent_scope);
    }

    function can_drop_symbol(ref, compressor, keep_lambda) {
        var def = ref.definition();
        if (ref.in_arg && is_funarg(def)) return false;
        return all(def.orig, function(sym) {
            if (sym instanceof AST_SymbolConst || sym instanceof AST_SymbolLet) {
                return compressor && can_varify(compressor, sym);
            }
            return !(keep_lambda && sym instanceof AST_SymbolLambda);
        });
    }

    function has_escaped(d, scope, node, parent) {
        if (parent instanceof AST_Assign) return parent.operator == "=" && parent.right === node;
        if (parent instanceof AST_Call) return parent.expression !== node || parent instanceof AST_New;
        if (parent instanceof AST_Exit) return parent.value === node && scope.resolve() !== d.scope.resolve();
        if (parent instanceof AST_VarDef) return parent.value === node;
    }

    var RE_POSITIVE_INTEGER = /^(0|[1-9][0-9]*)$/;
    (function(def) {
        def(AST_Node, noop);

        function reset_def(tw, compressor, def) {
            def.assignments = 0;
            def.bool_fn = 0;
            def.cross_loop = false;
            def.direct_access = false;
            def.escaped = [];
            def.fixed = !def.const_redefs
                && !def.scope.pinned()
                && !compressor.exposed(def)
                && !(def.init instanceof AST_LambdaExpression && def.init !== def.scope)
                && def.init;
            def.reassigned = 0;
            def.recursive_refs = 0;
            def.references = [];
            def.should_replace = undefined;
            def.single_use = undefined;
        }

        function reset_block_variables(tw, compressor, scope) {
            scope.variables.each(function(def) {
                reset_def(tw, compressor, def);
            });
        }

        function reset_variables(tw, compressor, scope) {
            scope.fn_defs = [];
            scope.variables.each(function(def) {
                reset_def(tw, compressor, def);
                var init = def.init;
                if (init instanceof AST_LambdaDefinition) {
                    scope.fn_defs.push(init);
                    init.safe_ids = null;
                }
                if (def.fixed === null) {
                    def.safe_ids = tw.safe_ids;
                    mark(tw, def);
                } else if (def.fixed) {
                    tw.loop_ids[def.id] = tw.in_loop;
                    mark(tw, def);
                }
            });
            scope.may_call_this = function() {
                scope.may_call_this = scope.contains_this() ? return_true : return_false;
            };
            if (scope.uses_arguments) scope.each_argname(function(node) {
                node.definition().last_ref = false;
            });
            if (compressor.option("ie")) scope.variables.each(function(def) {
                var d = def.orig[0].definition();
                if (d !== def) d.fixed = false;
            });
        }

        function walk_fn_def(tw, fn) {
            var was_scanning = tw.fn_scanning;
            tw.fn_scanning = fn;
            fn.walk(tw);
            tw.fn_scanning = was_scanning;
        }

        function revisit_fn_def(tw, fn) {
            fn.enclosed.forEach(function(d) {
                if (fn.variables.get(d.name) === d) return;
                if (safe_to_read(tw, d)) return;
                d.single_use = false;
                var fixed = d.fixed;
                if (typeof fixed == "function") fixed = fixed();
                if (fixed instanceof AST_Lambda && HOP(fixed, "safe_ids")) return;
                d.fixed = false;
            });
        }

        function mark_fn_def(tw, def, fn) {
            if (!HOP(fn, "safe_ids")) return;
            var marker = fn.safe_ids;
            if (marker === false) return;
            if (fn.parent_scope.resolve().may_call_this === return_true) {
                if (member(fn, tw.fn_visited)) revisit_fn_def(tw, fn);
            } else if (marker) {
                var visited = member(fn, tw.fn_visited);
                if (marker === tw.safe_ids) {
                    if (!visited) walk_fn_def(tw, fn);
                } else if (visited) {
                    revisit_fn_def(tw, fn);
                } else {
                    fn.safe_ids = false;
                }
            } else if (tw.fn_scanning && tw.fn_scanning !== def.scope.resolve()) {
                fn.safe_ids = false;
            } else {
                fn.safe_ids = tw.safe_ids;
                walk_fn_def(tw, fn);
            }
        }

        function pop_scope(tw, scope) {
            var fn_defs = scope.fn_defs;
            var tangled = scope.may_call_this === return_true ? fn_defs : fn_defs.filter(function(fn) {
                if (fn.safe_ids === false) return true;
                fn.safe_ids = tw.safe_ids;
                walk_fn_def(tw, fn);
                return false;
            });
            pop(tw);
            tangled.forEach(function(fn) {
                fn.safe_ids = tw.safe_ids;
                walk_fn_def(tw, fn);
            });
            fn_defs.forEach(function(fn) {
                delete fn.safe_ids;
            });
            delete scope.fn_defs;
            delete scope.may_call_this;
        }

        function push(tw) {
            tw.safe_ids = Object.create(tw.safe_ids);
        }

        function pop(tw) {
            tw.safe_ids = Object.getPrototypeOf(tw.safe_ids);
        }

        function mark(tw, def) {
            tw.safe_ids[def.id] = {};
        }

        function push_ref(def, ref) {
            def.references.push(ref);
            if (def.last_ref !== false) def.last_ref = ref;
        }

        function safe_to_read(tw, def) {
            if (def.single_use == "m") return false;
            var safe = tw.safe_ids[def.id];
            if (safe) {
                if (!HOP(tw.safe_ids, def.id)) safe.read = safe.read && safe.read !== tw.safe_ids ? true : tw.safe_ids;
                if (def.fixed == null) {
                    if (is_arguments(def)) return false;
                    if (def.global && def.name == "arguments") return false;
                    tw.loop_ids[def.id] = null;
                    def.fixed = make_node(AST_Undefined, def.orig[0]);
                    return true;
                }
                return !safe.assign || safe.assign === tw.safe_ids;
            }
            return def.fixed instanceof AST_LambdaDefinition;
        }

        function safe_to_assign(tw, def, declare) {
            if (!declare) {
                if (is_funarg(def) && def.scope.uses_arguments && !tw.has_directive("use strict")) return false;
                if (!all(def.orig, function(sym) {
                    return !(sym instanceof AST_SymbolConst);
                })) return false;
            }
            if (def.fixed === undefined) return declare || all(def.orig, function(sym) {
                return !(sym instanceof AST_SymbolLet);
            });
            if (def.fixed === false) return false;
            var safe = tw.safe_ids[def.id];
            if (def.safe_ids) {
                def.safe_ids[def.id] = false;
                delete def.safe_ids;
                return def.fixed === null || HOP(tw.safe_ids, def.id) && !safe.read;
            }
            if (!HOP(tw.safe_ids, def.id)) {
                if (!safe) return false;
                if (safe.read) {
                    var scope = tw.find_parent(AST_BlockScope);
                    if (scope instanceof AST_Class) return false;
                    if (def.scope.resolve() !== scope.resolve()) return false;
                }
                safe.assign = safe.assign && safe.assign !== tw.safe_ids ? true : tw.safe_ids;
            }
            if (def.fixed != null && safe.read) {
                if (safe.read !== tw.safe_ids) return false;
                if (tw.loop_ids[def.id] !== tw.in_loop) return false;
            }
            return safe_to_read(tw, def) && all(def.orig, function(sym) {
                return !(sym instanceof AST_SymbolLambda);
            });
        }

        function make_ref(ref, fixed) {
            var node = make_node(AST_SymbolRef, ref, ref);
            node.fixed = fixed || make_node(AST_Undefined, ref);
            return node;
        }

        function ref_once(compressor, def) {
            return compressor.option("unused")
                && !def.scope.pinned()
                && def.single_use !== false
                && def.references.length - def.recursive_refs == 1
                && !(is_funarg(def) && def.scope.uses_arguments);
        }

        function is_immutable(value) {
            if (!value) return false;
            if (value instanceof AST_Assign) {
                var op = value.operator;
                return op == "=" ? is_immutable(value.right) : !lazy_op[op.slice(0, -1)];
            }
            if (value instanceof AST_Sequence) return is_immutable(value.tail_node());
            return value.is_constant() || is_lambda(value) || value instanceof AST_ObjectIdentity;
        }

        function value_in_use(node, parent) {
            if (parent instanceof AST_Array) return true;
            if (parent instanceof AST_Binary) return lazy_op[parent.operator];
            if (parent instanceof AST_Conditional) return parent.condition !== node;
            if (parent instanceof AST_Sequence) return parent.tail_node() === node;
            if (parent instanceof AST_Spread) return true;
        }

        function mark_escaped(tw, d, scope, node, value, level, depth) {
            var parent = tw.parent(level);
            if (value && value.is_constant()) return;
            if (has_escaped(d, scope, node, parent)) {
                d.escaped.push(parent);
                if (depth > 1 && !(value && value.is_constant_expression(scope))) depth = 1;
                if (!d.escaped.depth || d.escaped.depth > depth) d.escaped.depth = depth;
                if (d.scope.resolve() !== scope.resolve()) d.escaped.cross_scope = true;
                return;
            } else if (value_in_use(node, parent)) {
                mark_escaped(tw, d, scope, parent, parent, level + 1, depth);
            } else if (parent instanceof AST_ObjectKeyVal && parent.value === node) {
                var obj = tw.parent(level + 1);
                mark_escaped(tw, d, scope, obj, obj, level + 2, depth);
            } else if (parent instanceof AST_PropAccess && parent.expression === node) {
                value = read_property(value, parent);
                mark_escaped(tw, d, scope, parent, value, level + 1, depth + 1);
                if (value) return;
            }
            if (level > 0) return;
            if (parent instanceof AST_Call && parent.expression === node) return;
            if (parent instanceof AST_Sequence && parent.tail_node() !== node) return;
            if (parent instanceof AST_SimpleStatement) return;
            if (parent instanceof AST_Unary && !unary_side_effects[parent.operator]) return;
            d.direct_access = true;
        }

        function mark_assignment_to_arguments(node) {
            if (!(node instanceof AST_Sub)) return;
            var expr = node.expression;
            if (!(expr instanceof AST_SymbolRef)) return;
            var def = expr.definition();
            if (!is_arguments(def)) return;
            var key = node.property;
            if (key.is_constant()) key = key.value;
            if (!(key instanceof AST_Node) && !RE_POSITIVE_INTEGER.test(key)) return;
            def.reassigned++;
            (key instanceof AST_Node ? def.scope.argnames : [ def.scope.argnames[key] ]).forEach(function(argname) {
                if (argname instanceof AST_SymbolFunarg) argname.definition().fixed = false;
            });
        }

        function scan_declaration(tw, compressor, lhs, fixed, visit) {
            var scanner = new TreeWalker(function(node) {
                if (node instanceof AST_DefaultValue) {
                    reset_flags(node);
                    push(tw);
                    node.value.walk(tw);
                    pop(tw);
                    var save = fixed;
                    if (save) fixed = function() {
                        var value = save();
                        var ev;
                        if (is_undefined(value, compressor)
                            || (ev = fuzzy_eval(compressor, value, true)) === undefined) {
                            return make_sequence(node, [ value, node.value ]);
                        }
                        return ev instanceof AST_Node ? node : value;
                    };
                    node.name.walk(scanner);
                    fixed = save;
                    return true;
                }
                if (node instanceof AST_DestructuredArray) {
                    reset_flags(node);
                    var save = fixed;
                    node.elements.forEach(function(node, index) {
                        if (node instanceof AST_Hole) return reset_flags(node);
                        if (save) fixed = function() {
                            return make_node(AST_Sub, node, {
                                expression: save(),
                                property: make_node(AST_Number, node, { value: index }),
                            });
                        };
                        node.walk(scanner);
                    });
                    if (node.rest) {
                        if (save) fixed = compressor.option("rests") && function() {
                            var value = save();
                            return value instanceof AST_Array ? make_node(AST_Array, node, {
                                elements: value.elements.slice(node.elements.length),
                            }) : node;
                        };
                        node.rest.walk(scanner);
                    }
                    fixed = save;
                    return true;
                }
                if (node instanceof AST_DestructuredObject) {
                    reset_flags(node);
                    var save = fixed;
                    node.properties.forEach(function(node) {
                        reset_flags(node);
                        if (node.key instanceof AST_Node) {
                            push(tw);
                            node.key.walk(tw);
                            pop(tw);
                        }
                        if (save) fixed = function() {
                            var key = node.key;
                            var type = AST_Sub;
                            if (typeof key == "string") {
                                if (is_identifier_string(key)) {
                                    type = AST_Dot;
                                } else {
                                    key = make_node_from_constant(key, node);
                                }
                            }
                            return make_node(type, node, {
                                expression: save(),
                                property: key
                            });
                        };
                        node.value.walk(scanner);
                    });
                    if (node.rest) {
                        fixed = false;
                        node.rest.walk(scanner);
                    }
                    fixed = save;
                    return true;
                }
                visit(node, fixed, function() {
                    var save_len = tw.stack.length;
                    for (var i = 0, len = scanner.stack.length - 1; i < len; i++) {
                        tw.stack.push(scanner.stack[i]);
                    }
                    node.walk(tw);
                    tw.stack.length = save_len;
                });
                return true;
            });
            lhs.walk(scanner);
        }

        function reduce_iife(tw, descend, compressor) {
            var fn = this;
            fn.inlined = false;
            var iife = tw.parent();
            var hit = is_async(fn) || is_generator(fn);
            var aborts = false;
            fn.walk(new TreeWalker(function(node) {
                if (hit) return aborts = true;
                if (node instanceof AST_Return) return hit = true;
                if (node instanceof AST_Scope && node !== fn) return true;
            }));
            if (aborts) push(tw);
            reset_variables(tw, compressor, fn);
            // Virtually turn IIFE parameters into variable definitions:
            //   (function(a,b) {...})(c,d) ---> (function() {var a=c,b=d; ...})()
            // So existing transformation rules can work on them.
            var safe = !fn.uses_arguments || tw.has_directive("use strict");
            fn.argnames.forEach(function(argname, i) {
                var value = iife.args[i];
                scan_declaration(tw, compressor, argname, function() {
                    var j = fn.argnames.indexOf(argname);
                    var arg = j < 0 ? value : iife.args[j];
                    if (arg instanceof AST_Sequence && arg.expressions.length < 2) arg = arg.expressions[0];
                    return arg || make_node(AST_Undefined, iife);
                }, visit);
            });
            var rest = fn.rest;
            if (rest) scan_declaration(tw, compressor, rest, compressor.option("rests") && function() {
                return fn.rest === rest ? make_node(AST_Array, fn, {
                    elements: iife.args.slice(fn.argnames.length),
                }) : rest;
            }, visit);
            walk_lambda(fn, tw);
            var safe_ids = tw.safe_ids;
            pop_scope(tw, fn);
            if (!aborts) tw.safe_ids = safe_ids;
            return true;

            function visit(node, fixed) {
                var d = node.definition();
                if (fixed && safe && d.fixed === undefined) {
                    mark(tw, d);
                    tw.loop_ids[d.id] = tw.in_loop;
                    d.fixed = fixed;
                    d.fixed.assigns = [ node ];
                } else {
                    d.fixed = false;
                }
            }
        }

        def(AST_Assign, function(tw, descend, compressor) {
            var node = this;
            var left = node.left;
            var right = node.right;
            var ld = left instanceof AST_SymbolRef && left.definition();
            var scan = ld || left instanceof AST_Destructured;
            switch (node.operator) {
              case "=":
                if (left.equivalent_to(right) && !left.has_side_effects(compressor)) {
                    right.walk(tw);
                    walk_prop(left);
                    node.__drop = true;
                    return true;
                }
                if (ld && right instanceof AST_LambdaExpression) {
                    walk_assign();
                    right.parent_scope.resolve().fn_defs.push(right);
                    right.safe_ids = null;
                    if (!ld.fixed || !node.write_only) mark_fn_def(tw, ld, right);
                    return true;
                }
                if (scan) {
                    right.walk(tw);
                    walk_assign();
                    return true;
                }
                mark_assignment_to_arguments(left);
                return;
              case "&&=":
              case "||=":
              case "??=":
                left.walk(tw);
                push(tw);
                if (scan) {
                    right.walk(tw);
                    walk_assign();
                } else {
                    mark_assignment_to_arguments(left);
                    right.walk(tw);
                }
                pop(tw);
                return true;
              default:
                if (!scan) {
                    mark_assignment_to_arguments(left);
                    return;
                }
                ld.assignments++;
                var fixed = ld.fixed;
                if (is_modified(compressor, tw, node, node, 0)) {
                    ld.fixed = false;
                    return;
                }
                var safe = safe_to_read(tw, ld);
                right.walk(tw);
                if (safe && !left.in_arg && safe_to_assign(tw, ld)) {
                    push_ref(ld, left);
                    mark(tw, ld);
                    if (ld.single_use) ld.single_use = false;
                    left.fixed = ld.fixed = function() {
                        return make_node(AST_Binary, node, {
                            operator: node.operator.slice(0, -1),
                            left: make_ref(left, fixed),
                            right: node.right,
                        });
                    };
                    left.fixed.assigns = !fixed || !fixed.assigns ? [] : fixed.assigns.slice();
                    left.fixed.assigns.push(node);
                } else {
                    left.walk(tw);
                    ld.fixed = false;
                }
                return true;
            }

            function walk_prop(lhs) {
                if (lhs instanceof AST_Dot) {
                    walk_prop(lhs.expression);
                } else if (lhs instanceof AST_Sub) {
                    walk_prop(lhs.expression);
                    lhs.property.walk(tw);
                } else if (lhs instanceof AST_SymbolRef) {
                    var d = lhs.definition();
                    push_ref(d, lhs);
                    if (d.fixed) {
                        lhs.fixed = d.fixed;
                        if (lhs.fixed.assigns) {
                            lhs.fixed.assigns.push(node);
                        } else {
                            lhs.fixed.assigns = [ node ];
                        }
                    }
                } else {
                    lhs.walk(tw);
                }
            }

            function walk_assign() {
                var recursive = ld && recursive_ref(tw, ld);
                var modified = is_modified(compressor, tw, node, right, 0, is_immutable(right), recursive);
                scan_declaration(tw, compressor, left, function() {
                    return node.right;
                }, function(sym, fixed, walk) {
                    if (!(sym instanceof AST_SymbolRef)) {
                        mark_assignment_to_arguments(sym);
                        walk();
                        return;
                    }
                    var d = sym.definition();
                    d.assignments++;
                    if (fixed && !modified && !sym.in_arg && safe_to_assign(tw, d)) {
                        push_ref(d, sym);
                        mark(tw, d);
                        if (left instanceof AST_Destructured
                            || d.orig.length == 1 && d.orig[0] instanceof AST_SymbolDefun) {
                            d.single_use = false;
                        }
                        tw.loop_ids[d.id] = tw.in_loop;
                        mark_escaped(tw, d, sym.scope, node, right, 0, 1);
                        sym.fixed = d.fixed = fixed;
                        sym.fixed.assigns = [ node ];
                    } else {
                        walk();
                        d.fixed = false;
                    }
                });
            }
        });
        def(AST_Binary, function(tw) {
            if (!lazy_op[this.operator]) return;
            this.left.walk(tw);
            push(tw);
            this.right.walk(tw);
            pop(tw);
            return true;
        });
        def(AST_BlockScope, function(tw, descend, compressor) {
            reset_block_variables(tw, compressor, this);
        });
        def(AST_Call, function(tw, descend) {
            var node = this;
            var exp = node.expression;
            if (exp instanceof AST_LambdaExpression) {
                var iife = is_iife_single(node);
                node.args.forEach(function(arg) {
                    arg.walk(tw);
                    if (arg instanceof AST_Spread) iife = false;
                });
                if (iife) exp.reduce_vars = reduce_iife;
                exp.walk(tw);
                if (iife) delete exp.reduce_vars;
                return true;
            }
            if (node.TYPE == "Call" && tw.in_boolean_context()) {
                if (exp instanceof AST_SymbolRef) {
                    exp.definition().bool_fn++;
                } else if (exp instanceof AST_Assign && exp.operator == "=" && exp.left instanceof AST_SymbolRef) {
                    exp.left.definition().bool_fn++;
                }
            }
            exp.walk(tw);
            var optional = node.optional;
            if (optional) push(tw);
            node.args.forEach(function(arg) {
                arg.walk(tw);
            });
            if (optional) pop(tw);
            var fixed = exp instanceof AST_SymbolRef && exp.fixed_value();
            if (fixed instanceof AST_Lambda) {
                mark_fn_def(tw, exp.definition(), fixed);
            } else {
                tw.find_parent(AST_Scope).may_call_this();
            }
            return true;
        });
        def(AST_Class, function(tw, descend, compressor) {
            var node = this;
            reset_block_variables(tw, compressor, node);
            if (node.extends) node.extends.walk(tw);
            var props = node.properties.filter(function(prop) {
                reset_flags(prop);
                if (prop.key instanceof AST_Node) prop.key.walk(tw);
                return prop.value;
            });
            if (node.name) {
                var d = node.name.definition();
                var parent = tw.parent();
                if (parent instanceof AST_ExportDeclaration || parent instanceof AST_ExportDefault) d.single_use = false;
                if (safe_to_assign(tw, d, true)) {
                    mark(tw, d);
                    tw.loop_ids[d.id] = tw.in_loop;
                    d.fixed = function() {
                        return node;
                    };
                    d.fixed.assigns = [ node ];
                    if (!is_safe_lexical(d)) d.single_use = false;
                } else {
                    d.fixed = false;
                }
            }
            props.forEach(function(prop) {
                if (!prop.static || prop instanceof AST_ClassField && prop.value.contains_this()) {
                    push(tw);
                    prop.value.walk(tw);
                    pop(tw);
                } else {
                    prop.value.walk(tw);
                }
            });
            return true;
        });
        def(AST_Conditional, function(tw) {
            this.condition.walk(tw);
            push(tw);
            this.consequent.walk(tw);
            pop(tw);
            push(tw);
            this.alternative.walk(tw);
            pop(tw);
            return true;
        });
        def(AST_DefaultValue, function(tw) {
            this.name.walk(tw);
            push(tw);
            this.value.walk(tw);
            pop(tw);
            return true;
        });
        def(AST_Do, function(tw) {
            var save_loop = tw.in_loop;
            tw.in_loop = this;
            push(tw);
            this.body.walk(tw);
            if (has_loop_control(this, tw.parent())) {
                pop(tw);
                push(tw);
            }
            this.condition.walk(tw);
            pop(tw);
            tw.in_loop = save_loop;
            return true;
        });
        def(AST_For, function(tw, descend, compressor) {
            var node = this;
            reset_block_variables(tw, compressor, node);
            if (node.init) node.init.walk(tw);
            var save_loop = tw.in_loop;
            tw.in_loop = node;
            push(tw);
            if (node.condition) node.condition.walk(tw);
            node.body.walk(tw);
            if (node.step) {
                if (has_loop_control(node, tw.parent())) {
                    pop(tw);
                    push(tw);
                }
                node.step.walk(tw);
            }
            pop(tw);
            tw.in_loop = save_loop;
            return true;
        });
        def(AST_ForEnumeration, function(tw, descend, compressor) {
            var node = this;
            reset_block_variables(tw, compressor, node);
            node.object.walk(tw);
            var save_loop = tw.in_loop;
            tw.in_loop = node;
            push(tw);
            var init = node.init;
            if (init instanceof AST_Definitions) {
                init.definitions[0].name.mark_symbol(function(node) {
                    if (node instanceof AST_SymbolDeclaration) {
                        var def = node.definition();
                        def.assignments++;
                        def.fixed = false;
                    }
                }, tw);
            } else if (init instanceof AST_Destructured || init instanceof AST_SymbolRef) {
                init.mark_symbol(function(node) {
                    if (node instanceof AST_SymbolRef) {
                        var def = node.definition();
                        push_ref(def, node);
                        def.assignments++;
                        if (!node.is_immutable()) def.fixed = false;
                    }
                }, tw);
            } else {
                init.walk(tw);
            }
            node.body.walk(tw);
            pop(tw);
            tw.in_loop = save_loop;
            return true;
        });
        def(AST_If, function(tw) {
            this.condition.walk(tw);
            push(tw);
            this.body.walk(tw);
            pop(tw);
            if (this.alternative) {
                push(tw);
                this.alternative.walk(tw);
                pop(tw);
            }
            return true;
        });
        def(AST_LabeledStatement, function(tw) {
            push(tw);
            this.body.walk(tw);
            pop(tw);
            return true;
        });
        def(AST_Lambda, function(tw, descend, compressor) {
            var fn = this;
            if (HOP(fn, "safe_ids") && fn.safe_ids !== tw.safe_ids) return true;
            if (!push_uniq(tw.fn_visited, fn)) return true;
            fn.inlined = false;
            push(tw);
            reset_variables(tw, compressor, fn);
            descend();
            pop_scope(tw, fn);
            if (fn.name) mark_escaped(tw, fn.name.definition(), fn, fn.name, fn, 0, 1);
            return true;
        });
        def(AST_LambdaDefinition, function(tw, descend, compressor) {
            var fn = this;
            var def = fn.name.definition();
            var parent = tw.parent();
            if (parent instanceof AST_ExportDeclaration || parent instanceof AST_ExportDefault) def.single_use = false;
            if (HOP(fn, "safe_ids") && fn.safe_ids !== tw.safe_ids) return true;
            if (!push_uniq(tw.fn_visited, fn)) return true;
            fn.inlined = false;
            push(tw);
            reset_variables(tw, compressor, fn);
            descend();
            pop_scope(tw, fn);
            return true;
        });
        def(AST_Sub, function(tw) {
            if (!this.optional) return;
            this.expression.walk(tw);
            push(tw);
            this.property.walk(tw);
            pop(tw);
            return true;
        });
        def(AST_Switch, function(tw, descend, compressor) {
            var node = this;
            reset_block_variables(tw, compressor, node);
            node.expression.walk(tw);
            var first = true;
            node.body.forEach(function(branch) {
                if (branch instanceof AST_Default) return;
                branch.expression.walk(tw);
                if (first) {
                    first = false;
                    push(tw);
                }
            })
            if (!first) pop(tw);
            walk_body(node, tw);
            return true;
        });
        def(AST_SwitchBranch, function(tw) {
            push(tw);
            walk_body(this, tw);
            pop(tw);
            return true;
        });
        def(AST_SymbolCatch, function() {
            this.definition().fixed = false;
        });
        def(AST_SymbolImport, function() {
            this.definition().fixed = false;
        });
        def(AST_SymbolRef, function(tw, descend, compressor) {
            var d = this.definition();
            push_ref(d, this);
            if (d.references.length == 1 && !d.fixed && d.orig[0] instanceof AST_SymbolDefun) {
                tw.loop_ids[d.id] = tw.in_loop;
            }
            var recursive = recursive_ref(tw, d);
            if (recursive) recursive.enclosed.forEach(function(def) {
                if (d === def) return;
                if (def.scope.resolve() === recursive) return;
                var assigns = def.fixed && def.fixed.assigns;
                if (!assigns) return;
                if (assigns[assigns.length - 1] instanceof AST_VarDef) return;
                var safe = tw.safe_ids[def.id];
                if (!safe) return;
                safe.assign = true;
            });
            if (d.fixed === false) {
                var redef = d.redefined();
                if (redef && cross_scope(d.scope, this.scope)) redef.single_use = false;
            } else if (d.fixed === undefined || !safe_to_read(tw, d)) {
                d.fixed = false;
            } else if (d.fixed) {
                if (this.in_arg && d.orig[0] instanceof AST_SymbolLambda) this.fixed = d.scope;
                var value = this.fixed_value();
                if (recursive) {
                    d.recursive_refs++;
                } else if (value && ref_once(compressor, d)) {
                    d.in_loop = tw.loop_ids[d.id] !== tw.in_loop;
                    d.single_use = is_lambda(value)
                            && !value.pinned()
                            && (!d.in_loop || tw.parent() instanceof AST_Call)
                        || !d.in_loop
                            && d.scope === this.scope.resolve()
                            && value.is_constant_expression();
                } else {
                    d.single_use = false;
                }
                if (is_modified(compressor, tw, this, value, 0, is_immutable(value), recursive)) {
                    if (d.single_use) {
                        d.single_use = "m";
                    } else {
                        d.fixed = false;
                    }
                }
                if (d.fixed && tw.loop_ids[d.id] !== tw.in_loop) d.cross_loop = true;
                mark_escaped(tw, d, this.scope, this, value, 0, 1);
            }
            if (!this.fixed) this.fixed = d.fixed;
            var parent;
            if (value instanceof AST_Lambda
                && !((parent = tw.parent()) instanceof AST_Call && parent.expression === this)) {
                mark_fn_def(tw, d, value);
            }
        });
        def(AST_Template, function(tw, descend) {
            var node = this;
            var tag = node.tag;
            if (!tag) return;
            if (tag instanceof AST_LambdaExpression) {
                node.expressions.forEach(function(exp) {
                    exp.walk(tw);
                });
                tag.walk(tw);
                return true;
            }
            tag.walk(tw);
            node.expressions.forEach(function(exp) {
                exp.walk(tw);
            });
            var fixed = tag instanceof AST_SymbolRef && tag.fixed_value();
            if (fixed instanceof AST_Lambda) {
                mark_fn_def(tw, tag.definition(), fixed);
            } else {
                tw.find_parent(AST_Scope).may_call_this();
            }
            return true;
        });
        def(AST_Toplevel, function(tw, descend, compressor) {
            var node = this;
            node.globals.each(function(def) {
                reset_def(tw, compressor, def);
            });
            push(tw);
            reset_variables(tw, compressor, node);
            descend();
            pop_scope(tw, node);
            return true;
        });
        def(AST_Try, function(tw, descend, compressor) {
            var node = this;
            reset_block_variables(tw, compressor, node);
            push(tw);
            walk_body(node, tw);
            pop(tw);
            if (node.bcatch) {
                push(tw);
                node.bcatch.walk(tw);
                pop(tw);
            }
            if (node.bfinally) node.bfinally.walk(tw);
            return true;
        });
        def(AST_Unary, function(tw, descend) {
            var node = this;
            if (!UNARY_POSTFIX[node.operator]) return;
            var exp = node.expression;
            if (!(exp instanceof AST_SymbolRef)) {
                mark_assignment_to_arguments(exp);
                return;
            }
            var d = exp.definition();
            d.assignments++;
            var fixed = d.fixed;
            if (safe_to_read(tw, d) && !exp.in_arg && safe_to_assign(tw, d)) {
                push_ref(d, exp);
                mark(tw, d);
                if (d.single_use) d.single_use = false;
                d.fixed = function() {
                    return make_node(AST_Binary, node, {
                        operator: node.operator.slice(0, -1),
                        left: make_node(AST_UnaryPrefix, node, {
                            operator: "+",
                            expression: make_ref(exp, fixed)
                        }),
                        right: make_node(AST_Number, node, {
                            value: 1
                        })
                    });
                };
                d.fixed.assigns = fixed && fixed.assigns ? fixed.assigns.slice() : [];
                d.fixed.assigns.push(node);
                if (node instanceof AST_UnaryPrefix) {
                    exp.fixed = d.fixed;
                } else {
                    exp.fixed = function() {
                        return make_node(AST_UnaryPrefix, node, {
                            operator: "+",
                            expression: make_ref(exp, fixed)
                        });
                    };
                    exp.fixed.assigns = fixed && fixed.assigns;
                }
            } else {
                exp.walk(tw);
                d.fixed = false;
            }
            return true;
        });
        def(AST_VarDef, function(tw, descend, compressor) {
            var node = this;
            var value = node.value;
            if (value instanceof AST_LambdaExpression && node.name instanceof AST_SymbolDeclaration) {
                walk_defn();
                value.parent_scope.resolve().fn_defs.push(value);
                value.safe_ids = null;
                var ld = node.name.definition();
                if (!ld.fixed) mark_fn_def(tw, ld, value);
            } else if (value) {
                value.walk(tw);
                walk_defn();
            } else if (tw.parent() instanceof AST_Let) {
                walk_defn();
            }
            return true;

            function walk_defn() {
                scan_declaration(tw, compressor, node.name, function() {
                    return node.value || make_node(AST_Undefined, node);
                }, function(name, fixed) {
                    var d = name.definition();
                    if (fixed && safe_to_assign(tw, d, true)) {
                        mark(tw, d);
                        tw.loop_ids[d.id] = tw.in_loop;
                        d.fixed = fixed;
                        d.fixed.assigns = [ node ];
                        if (name instanceof AST_SymbolConst && d.redefined()
                            || !(can_drop_symbol(name) || is_safe_lexical(d))) {
                            d.single_use = false;
                        }
                    } else {
                        d.fixed = false;
                    }
                });
            }
        });
        def(AST_While, function(tw, descend) {
            var save_loop = tw.in_loop;
            tw.in_loop = this;
            push(tw);
            descend();
            pop(tw);
            tw.in_loop = save_loop;
            return true;
        });
    })(function(node, func) {
        node.DEFMETHOD("reduce_vars", func);
    });

    function reset_flags(node) {
        node._squeezed = false;
        node._optimized = false;
        delete node.fixed;
        if (node instanceof AST_Scope) delete node._var_names;
    }

    AST_Toplevel.DEFMETHOD("reset_opt_flags", function(compressor) {
        var tw = new TreeWalker(compressor.option("reduce_vars") ? function(node, descend) {
            reset_flags(node);
            return node.reduce_vars(tw, descend, compressor);
        } : reset_flags);
        // Flow control for visiting lambda definitions
        tw.fn_scanning = null;
        tw.fn_visited = [];
        // Record the loop body in which `AST_SymbolDeclaration` is first encountered
        tw.in_loop = null;
        tw.loop_ids = Object.create(null);
        // Stack of look-up tables to keep track of whether a `SymbolDef` has been
        // properly assigned before use:
        // - `push()` & `pop()` when visiting conditional branches
        // - backup & restore via `save_ids` when visiting out-of-order sections
        tw.safe_ids = Object.create(null);
        this.walk(tw);
    });

    AST_Symbol.DEFMETHOD("fixed_value", function() {
        var fixed = this.definition().fixed;
        if (!fixed) return fixed;
        if (this.fixed) fixed = this.fixed;
        return fixed instanceof AST_Node ? fixed : fixed();
    });

    AST_SymbolRef.DEFMETHOD("is_immutable", function() {
        var def = this.redef || this.definition();
        return def.orig.length == 1 && def.orig[0] instanceof AST_SymbolLambda;
    });

    AST_Node.DEFMETHOD("convert_symbol", noop);
    function convert_destructured(type, process) {
        return this.transform(new TreeTransformer(function(node, descend) {
            if (node instanceof AST_DefaultValue) {
                node = node.clone();
                node.name = node.name.transform(this);
                return node;
            }
            if (node instanceof AST_Destructured) {
                node = node.clone();
                descend(node, this);
                return node;
            }
            if (node instanceof AST_DestructuredKeyVal) {
                node = node.clone();
                node.value = node.value.transform(this);
                return node;
            }
            return node.convert_symbol(type, process);
        }));
    }
    AST_DefaultValue.DEFMETHOD("convert_symbol", convert_destructured);
    AST_Destructured.DEFMETHOD("convert_symbol", convert_destructured);
    function convert_symbol(type, process) {
        var node = make_node(type, this, this);
        process(node, this);
        return node;
    }
    AST_SymbolDeclaration.DEFMETHOD("convert_symbol", convert_symbol);
    AST_SymbolRef.DEFMETHOD("convert_symbol", convert_symbol);

    function mark_destructured(process, tw) {
        var marker = new TreeWalker(function(node) {
            if (node instanceof AST_DefaultValue) {
                node.value.walk(tw);
                node.name.walk(marker);
                return true;
            }
            if (node instanceof AST_DestructuredKeyVal) {
                if (node.key instanceof AST_Node) node.key.walk(tw);
                node.value.walk(marker);
                return true;
            }
            return process(node);
        });
        this.walk(marker);
    }
    AST_DefaultValue.DEFMETHOD("mark_symbol", mark_destructured);
    AST_Destructured.DEFMETHOD("mark_symbol", mark_destructured);
    function mark_symbol(process) {
        return process(this);
    }
    AST_SymbolDeclaration.DEFMETHOD("mark_symbol", mark_symbol);
    AST_SymbolRef.DEFMETHOD("mark_symbol", mark_symbol);

    AST_Node.DEFMETHOD("match_symbol", function(predicate) {
        return predicate(this);
    });
    AST_Destructured.DEFMETHOD("match_symbol", function(predicate, ignore_side_effects) {
        var found = false;
        var tw = new TreeWalker(function(node) {
            if (found) return true;
            if (node instanceof AST_DefaultValue) {
                if (!ignore_side_effects) return found = true;
                node.name.walk(tw);
                return true;
            }
            if (node instanceof AST_DestructuredKeyVal) {
                if (!ignore_side_effects && node.key instanceof AST_Node) return found = true;
                node.value.walk(tw);
                return true;
            }
            if (predicate(node)) return found = true;
        });
        this.walk(tw);
        return found;
    });

    function in_async_generator(scope) {
        return scope instanceof AST_AsyncGeneratorDefun || scope instanceof AST_AsyncGeneratorFunction;
    }

    function find_scope(compressor) {
        var level = 0, node;
        while (node = compressor.parent(level++)) {
            if (node.variables) return node;
        }
    }

    var identifier_atom = makePredicate("Infinity NaN undefined");
    function is_lhs_read_only(lhs, compressor) {
        if (lhs instanceof AST_ObjectIdentity) return true;
        if (lhs instanceof AST_PropAccess) {
            if (lhs.property === "__proto__") return true;
            lhs = lhs.expression;
            if (lhs instanceof AST_SymbolRef) {
                if (lhs.is_immutable()) return false;
                lhs = lhs.fixed_value();
            }
            if (!lhs) return true;
            if (lhs.tail_node().is_constant()) return true;
            return is_lhs_read_only(lhs, compressor);
        }
        if (lhs instanceof AST_SymbolRef) {
            if (lhs.is_immutable()) return true;
            var def = lhs.definition();
            return compressor.exposed(def) && identifier_atom[def.name];
        }
        return false;
    }

    function make_node(ctor, orig, props) {
        if (!props) props = {};
        if (orig) {
            if (!props.start) props.start = orig.start;
            if (!props.end) props.end = orig.end;
        }
        return new ctor(props);
    }

    function make_sequence(orig, expressions) {
        if (expressions.length == 1) return expressions[0];
        return make_node(AST_Sequence, orig, {
            expressions: expressions.reduce(merge_sequence, [])
        });
    }

    function make_node_from_constant(val, orig) {
        switch (typeof val) {
          case "string":
            return make_node(AST_String, orig, {
                value: val
            });
          case "number":
            if (isNaN(val)) return make_node(AST_NaN, orig);
            if (isFinite(val)) {
                return 1 / val < 0 ? make_node(AST_UnaryPrefix, orig, {
                    operator: "-",
                    expression: make_node(AST_Number, orig, { value: -val })
                }) : make_node(AST_Number, orig, { value: val });
            }
            return val < 0 ? make_node(AST_UnaryPrefix, orig, {
                operator: "-",
                expression: make_node(AST_Infinity, orig)
            }) : make_node(AST_Infinity, orig);
          case "boolean":
            return make_node(val ? AST_True : AST_False, orig);
          case "undefined":
            return make_node(AST_Undefined, orig);
          default:
            if (val === null) {
                return make_node(AST_Null, orig, { value: null });
            }
            if (val instanceof RegExp) {
                return make_node(AST_RegExp, orig, { value: val });
            }
            throw new Error(string_template("Can't handle constant of type: {type}", {
                type: typeof val
            }));
        }
    }

    function needs_unbinding(compressor, val) {
        return val instanceof AST_PropAccess
            || is_undeclared_ref(val) && val.name == "eval";
    }

    // we shouldn't compress (1,func)(something) to
    // func(something) because that changes the meaning of
    // the func (becomes lexical instead of global).
    function maintain_this_binding(compressor, parent, orig, val) {
        var wrap = false;
        if (parent.TYPE == "Call") {
            wrap = parent.expression === orig && needs_unbinding(compressor, val);
        } else if (parent instanceof AST_Template) {
            wrap = parent.tag === orig && needs_unbinding(compressor, val);
        } else if (parent instanceof AST_UnaryPrefix) {
            wrap = parent.operator == "delete"
                || parent.operator == "typeof" && is_undeclared_ref(val);
        }
        return wrap ? make_sequence(orig, [ make_node(AST_Number, orig, { value: 0 }), val ]) : val;
    }

    function merge_sequence(array, node) {
        if (node instanceof AST_Sequence) {
            array.push.apply(array, node.expressions);
        } else {
            array.push(node);
        }
        return array;
    }

    function is_lexical_definition(stat) {
        return stat instanceof AST_Const || stat instanceof AST_DefClass || stat instanceof AST_Let;
    }

    function safe_to_trim(stat) {
        if (stat instanceof AST_LambdaDefinition) {
            var def = stat.name.definition();
            var scope = stat.name.scope;
            return def.scope === scope || all(def.references, function(ref) {
                var s = ref.scope;
                do {
                    if (s === scope) return true;
                } while (s = s.parent_scope);
            });
        }
        return !is_lexical_definition(stat);
    }

    function as_statement_array(thing) {
        if (thing === null) return [];
        if (thing instanceof AST_BlockStatement) return all(thing.body, safe_to_trim) ? thing.body : [ thing ];
        if (thing instanceof AST_EmptyStatement) return [];
        if (is_statement(thing)) return [ thing ];
        throw new Error("Can't convert thing to statement array");
    }

    function is_empty(thing) {
        if (thing === null) return true;
        if (thing instanceof AST_EmptyStatement) return true;
        if (thing instanceof AST_BlockStatement) return thing.body.length == 0;
        return false;
    }

    function has_declarations_only(block) {
        return all(block.body, function(stat) {
            return is_empty(stat)
                || stat instanceof AST_Defun
                || stat instanceof AST_Var && declarations_only(stat);
        });
    }

    function loop_body(x) {
        if (x instanceof AST_IterationStatement) {
            return x.body instanceof AST_BlockStatement ? x.body : x;
        }
        return x;
    }

    function root_expr(prop) {
        while (prop instanceof AST_PropAccess) prop = prop.expression;
        return prop;
    }

    function is_iife_call(node) {
        if (node.TYPE != "Call") return false;
        do {
            node = node.expression;
        } while (node instanceof AST_PropAccess);
        return node instanceof AST_LambdaExpression ? !is_arrow(node) : is_iife_call(node);
    }

    function is_iife_single(call) {
        var exp = call.expression;
        if (exp.name) return false;
        if (!(call instanceof AST_New)) return true;
        var found = false;
        exp.walk(new TreeWalker(function(node) {
            if (found) return true;
            if (node instanceof AST_NewTarget) return found = true;
            if (node instanceof AST_Scope && node !== exp) return true;
        }));
        return !found;
    }

    function is_undeclared_ref(node) {
        return node instanceof AST_SymbolRef && node.definition().undeclared;
    }

    var global_names = makePredicate("Array Boolean clearInterval clearTimeout console Date decodeURI decodeURIComponent encodeURI encodeURIComponent Error escape eval EvalError Function isFinite isNaN JSON Map Math Number parseFloat parseInt RangeError ReferenceError RegExp Object Set setInterval setTimeout String SyntaxError TypeError unescape URIError WeakMap WeakSet");
    AST_SymbolRef.DEFMETHOD("is_declared", function(compressor) {
        return this.defined
            || !this.definition().undeclared
            || compressor.option("unsafe") && global_names[this.name];
    });

    function declarations_only(node) {
        return all(node.definitions, function(var_def) {
            return !var_def.value;
        });
    }

    function is_declaration(stat, lexical) {
        if (stat instanceof AST_DefClass) return lexical && !stat.extends && all(stat.properties, function(prop) {
            if (prop.key instanceof AST_Node) return false;
            if (prop instanceof AST_ClassField && prop.static && prop.value) return false;
            return true;
        });
        if (stat instanceof AST_Definitions) return (lexical || stat instanceof AST_Var) && declarations_only(stat);
        if (stat instanceof AST_ExportDeclaration) return is_declaration(stat.body, lexical);
        if (stat instanceof AST_ExportDefault) return is_declaration(stat.body, lexical);
        return stat instanceof AST_LambdaDefinition;
    }

    function is_last_statement(body, stat) {
        var index = body.lastIndexOf(stat);
        if (index < 0) return false;
        while (++index < body.length) {
            if (!is_declaration(body[index], true)) return false;
        }
        return true;
    }

    function tighten_body(statements, compressor) {
        var in_loop, in_try, scope;
        find_loop_scope_try();
        var CHANGED, max_iter = 10;
        do {
            CHANGED = false;
            eliminate_spurious_blocks(statements);
            if (compressor.option("dead_code")) {
                eliminate_dead_code(statements, compressor);
            }
            if (compressor.option("if_return")) {
                handle_if_return(statements, compressor);
            }
            if (compressor.sequences_limit > 0) {
                sequencesize(statements, compressor);
                sequencesize_2(statements, compressor);
            }
            if (compressor.option("join_vars")) {
                join_consecutive_vars(statements);
            }
            if (compressor.option("collapse_vars")) {
                collapse(statements, compressor);
            }
        } while (CHANGED && max_iter-- > 0);
        return statements;

        function find_loop_scope_try() {
            var node = compressor.self(), level = 0;
            do {
                if (node instanceof AST_Catch) {
                    if (!compressor.parent(level).bfinally) level++;
                } else if (node instanceof AST_Finally) {
                    level++;
                } else if (node instanceof AST_IterationStatement) {
                    in_loop = true;
                } else if (node instanceof AST_Scope) {
                    scope = node;
                    break;
                } else if (node instanceof AST_Try) {
                    if (!in_try) in_try = node;
                }
            } while (node = compressor.parent(level++));
        }

        // Search from right to left for assignment-like expressions:
        // - `var a = x;`
        // - `a = x;`
        // - `++a`
        // For each candidate, scan from left to right for first usage, then try
        // to fold assignment into the site for compression.
        // Will not attempt to collapse assignments into or past code blocks
        // which are not sequentially executed, e.g. loops and conditionals.
        function collapse(statements, compressor) {
            if (scope.pinned()) return statements;
            var args;
            var assignments = Object.create(null);
            var candidates = [];
            var declare_only = Object.create(null);
            var force_single;
            var stat_index = statements.length;
            var scanner = new TreeTransformer(function(node, descend) {
                if (abort) return node;
                // Skip nodes before `candidate` as quickly as possible
                if (!hit) {
                    if (node !== hit_stack[hit_index]) return node;
                    hit_index++;
                    if (hit_index < hit_stack.length) return handle_custom_scan_order(node, scanner);
                    hit = true;
                    stop_after = (value_def ? find_stop_value : find_stop)(node, 0);
                    if (stop_after === node) abort = true;
                    return node;
                }
                // Stop immediately if these node types are encountered
                var parent = scanner.parent();
                if (should_stop(node, parent)) {
                    abort = true;
                    return node;
                }
                // Stop only if candidate is found within conditional branches
                if (!stop_if_hit && in_conditional(node, parent)) {
                    stop_if_hit = parent;
                }
                // Skip transient nodes caused by single-use variable replacement
                if (node.single_use && parent instanceof AST_VarDef && parent.value === node) return node;
                // Replace variable with assignment when found
                var hit_rhs;
                if (!(node instanceof AST_SymbolDeclaration)
                    && (scan_lhs && lhs.equivalent_to(node)
                        || scan_rhs && (hit_rhs = scan_rhs(node, this)))) {
                    if (!can_replace || stop_if_hit && (hit_rhs || !lhs_local || !replace_all)) {
                        if (!hit_rhs && !value_def) abort = true;
                        return node;
                    }
                    if (is_lhs(node, parent)) {
                        if (value_def && !hit_rhs) assign_used = true;
                        return node;
                    } else if (value_def) {
                        if (stop_if_hit && assign_pos == 0) assign_pos = remaining - replaced;
                        if (!hit_rhs) replaced++;
                        return node;
                    } else {
                        replaced++;
                    }
                    CHANGED = abort = true;
                    AST_Node.info("Collapsing {node} [{file}:{line},{col}]", {
                        node: node,
                        file: node.start.file,
                        line: node.start.line,
                        col: node.start.col,
                    });
                    if (candidate.TYPE == "Binary") return make_node(AST_Assign, candidate, {
                        operator: "=",
                        left: candidate.right.left,
                        right: make_node(AST_Conditional, candidate, {
                            condition: candidate.operator == "&&" ? candidate.left : candidate.left.negate(compressor),
                            consequent: candidate.right.right,
                            alternative: node,
                        }),
                    });
                    if (candidate instanceof AST_UnaryPostfix) {
                        if (lhs instanceof AST_SymbolRef) lhs.definition().fixed = false;
                        return make_node(AST_UnaryPrefix, candidate, candidate);
                    }
                    if (candidate instanceof AST_VarDef) {
                        var def = candidate.name.definition();
                        if (def.references.length - def.replaced == 1 && !compressor.exposed(def)) {
                            def.replaced++;
                            return maintain_this_binding(compressor, parent, node, candidate.value);
                        }
                        return make_node(AST_Assign, candidate, {
                            operator: "=",
                            left: make_node(AST_SymbolRef, candidate.name, candidate.name),
                            right: candidate.value,
                        });
                    }
                    var assign = candidate;
                    while (assign.write_only) {
                        assign.write_only = false;
                        if (!(assign instanceof AST_Assign)) break;
                        assign = assign.right;
                    }
                    return candidate;
                }
                // These node types have child nodes that execute sequentially,
                // but are otherwise not safe to scan into or beyond them.
                if (is_last_node(node, parent) || may_throw(node)) {
                    stop_after = node;
                    if (node instanceof AST_Scope) abort = true;
                }
                // Scan but don't replace inside getter/setter
                if (node instanceof AST_Accessor) {
                    var replace = can_replace;
                    can_replace = false;
                    descend(node, scanner);
                    can_replace = replace;
                    return signal_abort(node);
                }
                // Scan but don't replace inside destructuring expression
                if (node instanceof AST_Destructured) {
                    var replace = can_replace;
                    can_replace = false;
                    descend(node, scanner);
                    can_replace = replace;
                    return signal_abort(node);
                }
                // Scan but don't replace inside default value
                if (node instanceof AST_DefaultValue) {
                    node.name = node.name.transform(scanner);
                    var replace = can_replace;
                    can_replace = false;
                    node.value = node.value.transform(scanner);
                    can_replace = replace;
                    return signal_abort(node);
                }
                // Scan but don't replace inside block scope with colliding variable
                if (node instanceof AST_BlockScope
                    && !(node instanceof AST_Scope)
                    && !(node.variables && node.variables.all(function(def) {
                        return !lvalues.has(def.name);
                    }))) {
                    var replace = can_replace;
                    can_replace = false;
                    if (!handle_custom_scan_order(node, scanner)) descend(node, scanner);
                    can_replace = replace;
                    return signal_abort(node);
                }
                return handle_custom_scan_order(node, scanner);
            }, signal_abort);
            var multi_replacer = new TreeTransformer(function(node) {
                if (abort) return node;
                // Skip nodes before `candidate` as quickly as possible
                if (!hit) {
                    if (node !== hit_stack[hit_index]) return node;
                    hit_index++;
                    switch (hit_stack.length - hit_index) {
                      case 0:
                        hit = true;
                        if (assign_used) return node;
                        if (node !== candidate) return node;
                        if (node instanceof AST_VarDef) return node;
                        def.replaced++;
                        var parent = multi_replacer.parent();
                        if (parent instanceof AST_Sequence && parent.tail_node() !== node) {
                            value_def.replaced++;
                            return List.skip;
                        }
                        return rvalue;
                      case 1:
                        if (!assign_used && node.body === candidate) {
                            hit = true;
                            def.replaced++;
                            value_def.replaced++;
                            return null;
                        }
                      default:
                        return handle_custom_scan_order(node, multi_replacer);
                    }
                }
                // Replace variable when found
                if (node instanceof AST_SymbolRef && node.definition() === def) {
                    if (is_lhs(node, multi_replacer.parent())) return node;
                    if (!--replaced) abort = true;
                    var ref = rvalue.clone();
                    ref.scope = node.scope;
                    ref.reference();
                    if (replaced == assign_pos) {
                        abort = true;
                        return make_node(AST_Assign, candidate, {
                            operator: "=",
                            left: node,
                            right: ref,
                        });
                    }
                    def.replaced++;
                    return ref;
                }
                // Skip (non-executed) functions and (leading) default case in switch statements
                if (node instanceof AST_Default || node instanceof AST_Scope) return node;
            }, patch_sequence);
            while (--stat_index >= 0) {
                // Treat parameters as collapsible in IIFE, i.e.
                //   function(a, b){ ... }(x());
                // would be translated into equivalent assignments:
                //   var a = x(), b = undefined;
                if (stat_index == 0 && compressor.option("unused")) extract_args();
                // Find collapsible assignments
                var hit_stack = [];
                extract_candidates(statements[stat_index]);
                while (candidates.length > 0) {
                    hit_stack = candidates.pop();
                    var hit_index = 0;
                    var candidate = hit_stack[hit_stack.length - 1];
                    var assign_pos = -1;
                    var assign_used = false;
                    var remaining;
                    var value_def = null;
                    var stop_after = null;
                    var stop_if_hit = null;
                    var lhs = get_lhs(candidate);
                    var side_effects = lhs && lhs.has_side_effects(compressor);
                    var scan_lhs = lhs && !side_effects && !is_lhs_read_only(lhs, compressor);
                    var scan_rhs = foldable(candidate);
                    if (!scan_lhs && !scan_rhs) continue;
                    var funarg = candidate.name instanceof AST_SymbolFunarg;
                    var may_throw = return_false;
                    if (candidate.may_throw(compressor)) {
                        if (funarg && is_async(scope)) continue;
                        may_throw = in_try ? function(node) {
                            return node.has_side_effects(compressor);
                        } : side_effects_external;
                    }
                    var read_toplevel = false;
                    var modify_toplevel = false;
                    // Locate symbols which may execute code outside of scanning range
                    var well_defined = true;
                    var lvalues = get_lvalues(candidate);
                    var lhs_local = is_lhs_local(lhs);
                    var rvalue = get_rvalue(candidate);
                    if (!side_effects) side_effects = value_has_side_effects();
                    var check_destructured = in_try || !lhs_local ? function(node) {
                        return node instanceof AST_Destructured;
                    } : return_false;
                    var replace_all = replace_all_symbols(candidate);
                    var hit = funarg;
                    var abort = false;
                    var replaced = 0;
                    var can_replace = !args || !hit;
                    if (!can_replace) {
                        for (var j = candidate.arg_index + 1; !abort && j < args.length; j++) {
                            if (args[j]) args[j].transform(scanner);
                        }
                        can_replace = true;
                    }
                    for (var i = stat_index; !abort && i < statements.length; i++) {
                        statements[i].transform(scanner);
                    }
                    if (value_def) {
                        if (!replaced || remaining > replaced + assign_used) {
                            candidates.push(hit_stack);
                            force_single = true;
                            continue;
                        }
                        if (replaced == assign_pos) assign_used = true;
                        var def = lhs.definition();
                        abort = false;
                        hit_index = 0;
                        hit = funarg;
                        for (var i = stat_index; !abort && i < statements.length; i++) {
                            if (!statements[i].transform(multi_replacer)) statements.splice(i--, 1);
                        }
                        replaced = candidate instanceof AST_VarDef
                            && candidate === hit_stack[hit_stack.length - 1]
                            && def.references.length == def.replaced
                            && !compressor.exposed(def);
                        value_def.last_ref = false;
                        value_def.single_use = false;
                        CHANGED = true;
                    }
                    if (replaced && !remove_candidate(candidate)) statements.splice(stat_index, 1);
                }
            }

            function signal_abort(node) {
                if (abort) return node;
                if (stop_after === node) abort = true;
                if (stop_if_hit === node) stop_if_hit = null;
                return node;
            }

            function handle_custom_scan_order(node, tt) {
                if (!(node instanceof AST_BlockScope)) {
                    if (!(node instanceof AST_ClassProperty && !node.static)) return;
                    // Skip non-static class property values
                    if (node.key instanceof AST_Node) node.key = node.key.transform(tt);
                    return node;
                }
                // Skip (non-executed) functions
                if (node instanceof AST_Scope) return node;
                // Scan object only in a for-in/of statement
                if (node instanceof AST_ForEnumeration) {
                    node.object = node.object.transform(tt);
                    abort = true;
                    return node;
                }
                // Scan first case expression only in a switch statement
                if (node instanceof AST_Switch) {
                    node.expression = node.expression.transform(tt);
                    for (var i = 0; !abort && i < node.body.length; i++) {
                        var branch = node.body[i];
                        if (branch instanceof AST_Case) {
                            if (!hit) {
                                if (branch !== hit_stack[hit_index]) continue;
                                hit_index++;
                            }
                            branch.expression = branch.expression.transform(tt);
                            if (!replace_all) break;
                            scan_rhs = false;
                        }
                    }
                    abort = true;
                    return node;
                }
            }

            function is_direct_assignment(node, parent) {
                if (parent instanceof AST_Assign) return parent.operator == "=" && parent.left === node;
                if (parent instanceof AST_DefaultValue) return parent.name === node;
                if (parent instanceof AST_DestructuredArray) return true;
                if (parent instanceof AST_DestructuredKeyVal) return parent.value === node;
            }

            function should_stop(node, parent) {
                if (node === rvalue) return true;
                if (parent instanceof AST_For) {
                    if (node !== parent.init) return true;
                }
                if (node instanceof AST_Assign) {
                    return node.operator != "=" && lhs.equivalent_to(node.left);
                }
                if (node instanceof AST_Call) {
                    if (!(lhs instanceof AST_PropAccess)) return false;
                    if (!lhs.equivalent_to(node.expression)) return false;
                    return !(rvalue instanceof AST_LambdaExpression && !rvalue.contains_this());
                }
                if (node instanceof AST_Class) return !compressor.has_directive("use strict");
                if (node instanceof AST_Debugger) return true;
                if (node instanceof AST_Defun) return funarg && lhs.name === node.name.name;
                if (node instanceof AST_DestructuredKeyVal) return node.key instanceof AST_Node;
                if (node instanceof AST_DWLoop) return true;
                if (node instanceof AST_LoopControl) return true;
                if (node instanceof AST_SymbolRef) {
                    if (node.is_declared(compressor)) {
                        if (node.fixed_value()) return false;
                        if (can_drop_symbol(node)) {
                            return !(parent instanceof AST_PropAccess && parent.expression === node)
                                && is_arguments(node.definition());
                        }
                    } else if (is_direct_assignment(node, parent)) {
                        return false;
                    }
                    if (!replace_all) return true;
                    scan_rhs = false;
                    return false;
                }
                if (node instanceof AST_Try) return true;
                if (node instanceof AST_With) return true;
                return false;
            }

            function in_conditional(node, parent) {
                if (parent instanceof AST_Assign) return parent.left !== node && lazy_op[parent.operator.slice(0, -1)];
                if (parent instanceof AST_Binary) return parent.left !== node && lazy_op[parent.operator];
                if (parent instanceof AST_Call) return parent.optional && parent.expression !== node;
                if (parent instanceof AST_Case) return parent.expression !== node;
                if (parent instanceof AST_Conditional) return parent.condition !== node;
                if (parent instanceof AST_If) return parent.condition !== node;
                if (parent instanceof AST_Sub) return parent.optional && parent.expression !== node;
            }

            function is_last_node(node, parent) {
                if (node instanceof AST_Await) return true;
                if (node.TYPE == "Binary") return node.operator == "in" && !is_object(node.right);
                if (node instanceof AST_Call) {
                    var def, fn = node.expression;
                    if (fn instanceof AST_SymbolRef) {
                        def = fn.definition();
                        fn = fn.fixed_value();
                    }
                    if (!(fn instanceof AST_Lambda)) return !node.is_expr_pure(compressor);
                    if (def && recursive_ref(compressor, def, fn)) return true;
                    if (fn.collapse_scanning) return false;
                    fn.collapse_scanning = true;
                    var replace = can_replace;
                    can_replace = false;
                    var after = stop_after;
                    var if_hit = stop_if_hit;
                    if (!all(fn.argnames, function(argname) {
                        if (argname instanceof AST_DefaultValue) {
                            argname.value.transform(scanner);
                            if (abort) return false;
                            argname = argname.name;
                        }
                        return !(argname instanceof AST_Destructured);
                    })) {
                        abort = true;
                    } else if (is_arrow(fn) && fn.value) {
                        fn.value.transform(scanner);
                    } else for (var i = 0; !abort && i < fn.body.length; i++) {
                        var stat = fn.body[i];
                        if (stat instanceof AST_Return) {
                            if (stat.value) stat.value.transform(scanner);
                            break;
                        }
                        stat.transform(scanner);
                    }
                    stop_if_hit = if_hit;
                    stop_after = after;
                    can_replace = replace;
                    delete fn.collapse_scanning;
                    if (!abort) return false;
                    abort = false;
                    return true;
                }
                if (node instanceof AST_Exit) {
                    if (in_try) {
                        if (in_try.bfinally) return true;
                        if (in_try.bcatch && node instanceof AST_Throw) return true;
                    }
                    return side_effects || lhs instanceof AST_PropAccess || may_modify(lhs);
                }
                if (node instanceof AST_Function) {
                    return compressor.option("ie") && node.name && lvalues.has(node.name.name);
                }
                if (node instanceof AST_ObjectIdentity) return symbol_in_lvalues(node, parent);
                if (node instanceof AST_PropAccess) {
                    if (side_effects) return true;
                    var exp = node.expression;
                    if (exp instanceof AST_SymbolRef && is_arguments(exp.definition())) return true;
                    if (compressor.option("unsafe")) {
                        if (is_undeclared_ref(exp) && global_names[exp.name]) return false;
                        if (is_static_fn(exp)) return false;
                    }
                    if (!well_defined) return true;
                    if (value_def) return false;
                    if (!in_try && lhs_local) return false;
                    if (node.optional) return false;
                    return exp.may_throw_on_access(compressor);
                }
                if (node instanceof AST_Spread) return true;
                if (node instanceof AST_SymbolRef) {
                    if (symbol_in_lvalues(node, parent)) return !is_direct_assignment(node, parent);
                    if (side_effects && may_modify(node)) return true;
                    var def = node.definition();
                    return (in_try || def.scope.resolve() !== scope) && !can_drop_symbol(node);
                }
                if (node instanceof AST_Template) return !node.is_expr_pure(compressor);
                if (node instanceof AST_VarDef) {
                    if (check_destructured(node.name)) return true;
                    return (node.value || parent instanceof AST_Let) && node.name.match_symbol(function(node) {
                        return node instanceof AST_SymbolDeclaration
                            && (lvalues.has(node.name) || side_effects && may_modify(node));
                    }, true);
                }
                if (node instanceof AST_Yield) return true;
                var sym = is_lhs(node.left, node);
                if (!sym) return false;
                if (sym instanceof AST_PropAccess) return true;
                if (check_destructured(sym)) return true;
                return sym.match_symbol(function(node) {
                    return node instanceof AST_SymbolRef
                        && (lvalues.has(node.name) || read_toplevel && compressor.exposed(node.definition()));
                }, true);
            }

            function may_throw_destructured(node, value) {
                if (!value) return !(node instanceof AST_Symbol);
                if (node instanceof AST_DefaultValue) {
                    return value.has_side_effects(compressor)
                        || node.value.has_side_effects(compressor)
                        || may_throw_destructured(node.name, is_undefined(value) && node.value);
                }
                if (node instanceof AST_Destructured) {
                    if (node.rest && may_throw_destructured(node.rest)) return true;
                    if (node instanceof AST_DestructuredArray) {
                        if (!(value instanceof AST_Array || value.is_string(compressor))) return true;
                        return !all(node.elements, function(element) {
                            return !may_throw_destructured(element);
                        });
                    }
                    if (node instanceof AST_DestructuredObject) {
                        if (!value.is_defined(compressor)) return true;
                        return !all(node.properties, function(prop) {
                            if (prop instanceof AST_Node && prop.has_side_effects(compressor)) return false;
                            return !may_throw_destructured(prop.value);
                        });
                    }
                }
            }

            function extract_args() {
                var iife, fn = compressor.self();
                if (fn instanceof AST_LambdaExpression
                    && !is_generator(fn)
                    && !fn.uses_arguments
                    && !fn.pinned()
                    && (iife = compressor.parent()) instanceof AST_Call
                    && iife.expression === fn
                    && is_iife_single(iife)
                    && all(iife.args, function(arg) {
                        return !(arg instanceof AST_Spread);
                    })) {
                    var fn_strict = compressor.has_directive("use strict");
                    if (fn_strict && !member(fn_strict, fn.body)) fn_strict = false;
                    var has_await = is_async(fn) ? function(node) {
                        return node instanceof AST_Symbol && node.name == "await";
                    } : function(node) {
                        return node instanceof AST_Await && !tw.find_parent(AST_Scope);
                    };
                    var arg_scope = null;
                    var tw = new TreeWalker(function(node, descend) {
                        if (!arg) return true;
                        if (has_await(node) || node instanceof AST_Yield) {
                            arg = null;
                            return true;
                        }
                        if (node instanceof AST_ObjectIdentity && (fn_strict || !arg_scope)) {
                            arg = null;
                            return true;
                        }
                        if (node instanceof AST_SymbolRef && fn.variables.has(node.name)) {
                            var s = node.definition().scope;
                            if (s !== scope) while (s = s.parent_scope) {
                                if (s === scope) return true;
                            }
                            arg = null;
                        }
                        if (node instanceof AST_Scope && !is_arrow(node)) {
                            var save_scope = arg_scope;
                            arg_scope = node;
                            descend();
                            arg_scope = save_scope;
                            return true;
                        }
                    });
                    args = iife.args.slice();
                    var len = args.length;
                    var names = Object.create(null);
                    for (var i = fn.argnames.length; --i >= 0;) {
                        var sym = fn.argnames[i];
                        var arg = args[i];
                        var value;
                        if (sym instanceof AST_DefaultValue) {
                            value = sym.value;
                            sym = sym.name;
                            args[len + i] = value;
                        }
                        if (sym instanceof AST_Destructured) {
                            if (!may_throw_destructured(sym, arg)) continue;
                            candidates.length = 0;
                            break;
                        }
                        if (sym.name in names) continue;
                        names[sym.name] = true;
                        if (value) arg = !arg || is_undefined(arg) ? value : null;
                        if (!arg && !value) {
                            arg = make_node(AST_Undefined, sym).transform(compressor);
                        } else if (arg instanceof AST_Lambda && arg.pinned()) {
                            arg = null;
                        } else if (arg) {
                            arg.walk(tw);
                        }
                        if (!arg) continue;
                        var candidate = make_node(AST_VarDef, sym, {
                            name: sym,
                            value: arg,
                        });
                        candidate.name_index = i;
                        candidate.arg_index = value ? len + i : i;
                        candidates.unshift([ candidate ]);
                    }
                }
            }

            function extract_candidates(expr, unused) {
                hit_stack.push(expr);
                if (expr instanceof AST_Array) {
                    expr.elements.forEach(function(node) {
                        extract_candidates(node, unused);
                    });
                } else if (expr instanceof AST_Assign) {
                    var lhs = expr.left;
                    if (!(lhs instanceof AST_Destructured)) candidates.push(hit_stack.slice());
                    extract_candidates(lhs);
                    extract_candidates(expr.right);
                    if (lhs instanceof AST_SymbolRef && expr.operator == "=") {
                        assignments[lhs.name] = (assignments[lhs.name] || 0) + 1;
                    }
                } else if (expr instanceof AST_Await) {
                    extract_candidates(expr.expression, unused);
                } else if (expr instanceof AST_Binary) {
                    var lazy = lazy_op[expr.operator];
                    if (unused
                        && lazy
                        && expr.operator != "??"
                        && expr.right instanceof AST_Assign
                        && expr.right.operator == "="
                        && !(expr.right.left instanceof AST_Destructured)) {
                        candidates.push(hit_stack.slice());
                    }
                    extract_candidates(expr.left, !lazy && unused);
                    extract_candidates(expr.right, unused);
                } else if (expr instanceof AST_Call) {
                    extract_candidates(expr.expression);
                    expr.args.forEach(extract_candidates);
                } else if (expr instanceof AST_Case) {
                    extract_candidates(expr.expression);
                } else if (expr instanceof AST_Conditional) {
                    extract_candidates(expr.condition);
                    extract_candidates(expr.consequent, unused);
                    extract_candidates(expr.alternative, unused);
                } else if (expr instanceof AST_Definitions) {
                    expr.definitions.forEach(extract_candidates);
                } else if (expr instanceof AST_Dot) {
                    extract_candidates(expr.expression);
                } else if (expr instanceof AST_DWLoop) {
                    extract_candidates(expr.condition);
                    if (!(expr.body instanceof AST_Block)) {
                        extract_candidates(expr.body);
                    }
                } else if (expr instanceof AST_Exit) {
                    if (expr.value) extract_candidates(expr.value);
                } else if (expr instanceof AST_For) {
                    if (expr.init) extract_candidates(expr.init, true);
                    if (expr.condition) extract_candidates(expr.condition);
                    if (expr.step) extract_candidates(expr.step, true);
                    if (!(expr.body instanceof AST_Block)) {
                        extract_candidates(expr.body);
                    }
                } else if (expr instanceof AST_ForEnumeration) {
                    extract_candidates(expr.object);
                    if (!(expr.body instanceof AST_Block)) {
                        extract_candidates(expr.body);
                    }
                } else if (expr instanceof AST_If) {
                    extract_candidates(expr.condition);
                    if (!(expr.body instanceof AST_Block)) {
                        extract_candidates(expr.body);
                    }
                    if (expr.alternative && !(expr.alternative instanceof AST_Block)) {
                        extract_candidates(expr.alternative);
                    }
                } else if (expr instanceof AST_Object) {
                    expr.properties.forEach(function(prop) {
                        hit_stack.push(prop);
                        if (prop.key instanceof AST_Node) extract_candidates(prop.key);
                        if (prop instanceof AST_ObjectKeyVal) extract_candidates(prop.value, unused);
                        hit_stack.pop();
                    });
                } else if (expr instanceof AST_Sequence) {
                    var end = expr.expressions.length - (unused ? 0 : 1);
                    expr.expressions.forEach(function(node, index) {
                        extract_candidates(node, index < end);
                    });
                } else if (expr instanceof AST_SimpleStatement) {
                    extract_candidates(expr.body, true);
                } else if (expr instanceof AST_Spread) {
                    extract_candidates(expr.expression);
                } else if (expr instanceof AST_Sub) {
                    extract_candidates(expr.expression);
                    extract_candidates(expr.property);
                } else if (expr instanceof AST_Switch) {
                    extract_candidates(expr.expression);
                    expr.body.forEach(extract_candidates);
                } else if (expr instanceof AST_Unary) {
                    if (UNARY_POSTFIX[expr.operator]) {
                        candidates.push(hit_stack.slice());
                    } else {
                        extract_candidates(expr.expression);
                    }
                } else if (expr instanceof AST_VarDef) {
                    if (expr.name instanceof AST_SymbolVar) {
                        if (expr.value) {
                            var def = expr.name.definition();
                            if (def.references.length > def.replaced) {
                                candidates.push(hit_stack.slice());
                            }
                        } else {
                            declare_only[expr.name.name] = (declare_only[expr.name.name] || 0) + 1;
                        }
                    }
                    if (expr.value) extract_candidates(expr.value);
                } else if (expr instanceof AST_Yield) {
                    if (expr.expression) extract_candidates(expr.expression);
                }
                hit_stack.pop();
            }

            function find_stop(node, level) {
                var parent = scanner.parent(level);
                if (parent instanceof AST_Array) return node;
                if (parent instanceof AST_Assign) return node;
                if (parent instanceof AST_Await) return node;
                if (parent instanceof AST_Binary) return node;
                if (parent instanceof AST_Call) return node;
                if (parent instanceof AST_Case) return node;
                if (parent instanceof AST_Conditional) return node;
                if (parent instanceof AST_Definitions) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Exit) return node;
                if (parent instanceof AST_If) return node;
                if (parent instanceof AST_IterationStatement) return node;
                if (parent instanceof AST_ObjectProperty) return node;
                if (parent instanceof AST_PropAccess) return node;
                if (parent instanceof AST_Sequence) {
                    return (parent.tail_node() === node ? find_stop : find_stop_unused)(parent, level + 1);
                }
                if (parent instanceof AST_SimpleStatement) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Spread) return node;
                if (parent instanceof AST_Switch) return node;
                if (parent instanceof AST_Unary) return node;
                if (parent instanceof AST_VarDef) return node;
                if (parent instanceof AST_Yield) return node;
                return null;
            }

            function find_stop_logical(parent, op, level) {
                var node;
                do {
                    node = parent;
                    parent = scanner.parent(++level);
                } while (parent instanceof AST_Assign && parent.operator.slice(0, -1) == op
                    || parent instanceof AST_Binary && parent.operator == op);
                return node;
            }

            function find_stop_expr(expr, cont, node, parent, level) {
                var replace = can_replace;
                can_replace = false;
                var after = stop_after;
                var if_hit = stop_if_hit;
                var stack = scanner.stack;
                scanner.stack = [ parent ];
                expr.transform(scanner);
                scanner.stack = stack;
                stop_if_hit = if_hit;
                stop_after = after;
                can_replace = replace;
                if (abort) {
                    abort = false;
                    return node;
                }
                return cont(parent, level + 1);
            }

            function find_stop_value(node, level) {
                var parent = scanner.parent(level);
                if (parent instanceof AST_Array) return find_stop_value(parent, level + 1);
                if (parent instanceof AST_Assign) {
                    if (may_throw(parent)) return node;
                    if (parent.left.match_symbol(function(ref) {
                        return ref instanceof AST_SymbolRef && (lhs.name == ref.name || value_def.name == ref.name);
                    })) return node;
                    var op;
                    if (parent.left === node || !lazy_op[op = parent.operator.slice(0, -1)]) {
                        return find_stop_value(parent, level + 1);
                    }
                    return find_stop_logical(parent, op, level);
                }
                if (parent instanceof AST_Binary) {
                    var op;
                    if (parent.left === node || !lazy_op[op = parent.operator]) {
                        return find_stop_value(parent, level + 1);
                    }
                    return find_stop_logical(parent, op, level);
                }
                if (parent instanceof AST_Call) return parent;
                if (parent instanceof AST_Case) {
                    if (parent.expression !== node) return node;
                    return find_stop_value(parent, level + 1);
                }
                if (parent instanceof AST_Conditional) {
                    if (parent.condition !== node) return node;
                    return find_stop_value(parent, level + 1);
                }
                if (parent instanceof AST_Definitions) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Do) return node;
                if (parent instanceof AST_Exit) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_For) {
                    if (parent.init !== node && parent.condition !== node) return node;
                    return find_stop_value(parent, level + 1);
                }
                if (parent instanceof AST_ForEnumeration) {
                    if (parent.init !== node) return node;
                    return find_stop_value(parent, level + 1);
                }
                if (parent instanceof AST_If) {
                    if (parent.condition !== node) return node;
                    return find_stop_value(parent, level + 1);
                }
                if (parent instanceof AST_ObjectProperty) {
                    var obj = scanner.parent(level + 1);
                    return all(obj.properties, function(prop) {
                        return prop instanceof AST_ObjectKeyVal;
                    }) ? find_stop_value(obj, level + 2) : obj;
                }
                if (parent instanceof AST_PropAccess) {
                    var exp = parent.expression;
                    return exp === node ? find_stop_value(parent, level + 1) : node;
                }
                if (parent instanceof AST_Sequence) {
                    return (parent.tail_node() === node ? find_stop_value : find_stop_unused)(parent, level + 1);
                }
                if (parent instanceof AST_SimpleStatement) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Spread) return find_stop_value(parent, level + 1);
                if (parent instanceof AST_Switch) {
                    if (parent.expression !== node) return node;
                    return find_stop_value(parent, level + 1);
                }
                if (parent instanceof AST_Unary) {
                    if (parent.operator == "delete") return node;
                    return find_stop_value(parent, level + 1);
                }
                if (parent instanceof AST_VarDef) return parent.name.match_symbol(function(sym) {
                    return sym instanceof AST_SymbolDeclaration && (lhs.name == sym.name || value_def.name == sym.name);
                }) ? node : find_stop_value(parent, level + 1);
                if (parent instanceof AST_While) {
                    if (parent.condition !== node) return node;
                    return find_stop_value(parent, level + 1);
                }
                if (parent instanceof AST_Yield) return find_stop_value(parent, level + 1);
                return null;
            }

            function find_stop_unused(node, level) {
                var parent = scanner.parent(level);
                if (is_last_node(node, parent)) return node;
                if (in_conditional(node, parent)) return node;
                if (parent instanceof AST_Array) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Assign) return check_assignment(parent.left);
                if (parent instanceof AST_Await) return node;
                if (parent instanceof AST_Binary) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Call) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Case) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Conditional) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Definitions) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Exit) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_If) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_IterationStatement) return node;
                if (parent instanceof AST_ObjectProperty) {
                    var obj = scanner.parent(level + 1);
                    return all(obj.properties, function(prop) {
                        return prop instanceof AST_ObjectKeyVal;
                    }) ? find_stop_unused(obj, level + 2) : obj;
                }
                if (parent instanceof AST_PropAccess) {
                    var exp = parent.expression;
                    if (exp === node) return find_stop_unused(parent, level + 1);
                    return find_stop_expr(exp, find_stop_unused, node, parent, level);
                }
                if (parent instanceof AST_Sequence) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_SimpleStatement) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Spread) return node;
                if (parent instanceof AST_Switch) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_Unary) return find_stop_unused(parent, level + 1);
                if (parent instanceof AST_VarDef) return check_assignment(parent.name);
                if (parent instanceof AST_Yield) return node;
                return null;

                function check_assignment(lhs) {
                    if (may_throw(parent)) return node;
                    if (lhs !== node && lhs instanceof AST_Destructured) {
                        return find_stop_expr(lhs, find_stop_unused, node, parent, level);
                    }
                    return find_stop_unused(parent, level + 1);
                }
            }

            function mangleable_var(rhs) {
                if (force_single) {
                    force_single = false;
                    return;
                }
                if (remaining < 1) return;
                var value = rhs instanceof AST_Assign && rhs.operator == "=" ? rhs.left : rhs;
                if (!(value instanceof AST_SymbolRef)) return;
                var def = value.definition();
                if (def.undeclared) return;
                if (is_arguments(def)) return;
                if (value !== rhs) {
                    if (is_lhs_read_only(value, compressor)) return;
                    var referenced = def.references.length - def.replaced;
                    if (referenced < 2) return;
                    var expr = candidate.clone();
                    expr[expr instanceof AST_Assign ? "right" : "value"] = value;
                    if (candidate.name_index >= 0) {
                        expr.name_index = candidate.name_index;
                        expr.arg_index = candidate.arg_index;
                    }
                    candidate = expr;
                }
                return value_def = def;
            }

            function remaining_refs(def) {
                return def.references.length - def.replaced - (assignments[def.name] || 0);
            }

            function get_lhs(expr) {
                if (expr instanceof AST_Assign) {
                    var lhs = expr.left;
                    if (expr.operator != "=") return lhs;
                    if (!(lhs instanceof AST_SymbolRef)) return lhs;
                    var def = lhs.definition();
                    if (scope.uses_arguments && is_funarg(def)) return lhs;
                    if (compressor.exposed(def)) return lhs;
                    remaining = remaining_refs(def);
                    if (def.fixed && lhs.fixed) {
                        var matches = def.references.filter(function(ref) {
                            return ref.fixed === lhs.fixed;
                        }).length - 1;
                        if (matches < remaining) {
                            remaining = matches;
                            assign_pos = 0;
                        }
                    }
                    mangleable_var(expr.right);
                    return lhs;
                }
                if (expr instanceof AST_Binary) return expr.right.left;
                if (expr instanceof AST_Unary) return expr.expression;
                if (expr instanceof AST_VarDef) {
                    var lhs = expr.name;
                    var def = lhs.definition();
                    if (def.const_redefs) return;
                    if (!member(lhs, def.orig)) return;
                    if (scope.uses_arguments && is_funarg(def)) return;
                    var declared = def.orig.length - def.eliminated - (declare_only[def.name] || 0);
                    remaining = remaining_refs(def);
                    if (def.fixed) remaining = Math.min(remaining, def.references.filter(function(ref) {
                        if (!ref.fixed) return true;
                        if (!ref.fixed.assigns) return true;
                        var assign = ref.fixed.assigns[0];
                        return assign === lhs || get_rvalue(assign) === expr.value;
                    }).length);
                    if (declared > 1 && !(lhs instanceof AST_SymbolFunarg)) {
                        mangleable_var(expr.value);
                        return make_node(AST_SymbolRef, lhs, lhs);
                    }
                    if (mangleable_var(expr.value) || remaining == 1 && !compressor.exposed(def)) {
                        return make_node(AST_SymbolRef, lhs, lhs);
                    }
                    return;
                }
            }

            function get_rvalue(expr) {
                if (expr instanceof AST_Assign) return expr.right;
                if (expr instanceof AST_Binary) {
                    var node = expr.clone();
                    node.right = expr.right.right;
                    return node;
                }
                if (expr instanceof AST_VarDef) return expr.value;
            }

            function invariant(expr) {
                if (expr instanceof AST_Array) return false;
                if (expr instanceof AST_Binary && lazy_op[expr.operator]) {
                    return invariant(expr.left) && invariant(expr.right);
                }
                if (expr instanceof AST_Call) return false;
                if (expr instanceof AST_Conditional) {
                    return invariant(expr.consequent) && invariant(expr.alternative);
                }
                if (expr instanceof AST_Object) return false;
                return !expr.has_side_effects(compressor);
            }

            function foldable(expr) {
                if (expr instanceof AST_Assign && expr.right.single_use) return;
                var lhs_ids = Object.create(null);
                var marker = new TreeWalker(function(node) {
                    if (node instanceof AST_SymbolRef) lhs_ids[node.definition().id] = true;
                });
                while (expr instanceof AST_Assign && expr.operator == "=") {
                    expr.left.walk(marker);
                    expr = expr.right;
                }
                if (expr instanceof AST_ObjectIdentity) return rhs_exact_match;
                if (expr instanceof AST_SymbolRef) {
                    var value = expr.evaluate(compressor);
                    if (value === expr) return rhs_exact_match;
                    return rhs_fuzzy_match(value, rhs_exact_match);
                }
                if (expr.is_truthy()) return rhs_fuzzy_match(true, return_false);
                if (expr.is_constant()) {
                    var ev = expr.evaluate(compressor);
                    if (!(ev instanceof AST_Node)) return rhs_fuzzy_match(ev, rhs_exact_match);
                }
                if (!(lhs instanceof AST_SymbolRef)) return false;
                if (!invariant(expr)) return false;
                var circular;
                expr.walk(new TreeWalker(function(node) {
                    if (circular) return true;
                    if (node instanceof AST_SymbolRef && lhs_ids[node.definition().id]) circular = true;
                }));
                return !circular && rhs_exact_match;

                function rhs_exact_match(node) {
                    return expr.equivalent_to(node);
                }
            }

            function rhs_fuzzy_match(value, fallback) {
                return function(node, tw) {
                    if (tw.in_boolean_context()) {
                        if (value && node.is_truthy() && !node.has_side_effects(compressor)) {
                            return true;
                        }
                        if (node.is_constant()) {
                            var ev = node.evaluate(compressor);
                            if (!(ev instanceof AST_Node)) return !ev == !value;
                        }
                    }
                    return fallback(node);
                };
            }

            function may_be_global(node) {
                if (node instanceof AST_SymbolRef) {
                    node = node.fixed_value();
                    if (!node) return true;
                }
                if (node instanceof AST_Assign) return node.operator == "=" && may_be_global(node.right);
                return node instanceof AST_PropAccess || node instanceof AST_ObjectIdentity;
            }

            function get_lvalues(expr) {
                var lvalues = new Dictionary();
                if (expr instanceof AST_VarDef) {
                    if (!expr.name.definition().fixed) well_defined = false;
                    lvalues.add(expr.name.name, lhs);
                }
                var find_arguments = scope.uses_arguments && !compressor.has_directive("use strict");
                var scan_toplevel = scope instanceof AST_Toplevel;
                var tw = new TreeWalker(function(node) {
                    var value;
                    if (node instanceof AST_SymbolRef) {
                        value = node.fixed_value();
                        if (!value) {
                            value = node;
                            var def = node.definition();
                            if (!def.undeclared
                                && (def.assignments || !def.escaped || def.escaped.cross_scope)
                                && (has_escaped(def, node.scope, node, tw.parent()) || !same_scope(def))) {
                                well_defined = false;
                            }
                        }
                    } else if (node instanceof AST_ObjectIdentity) {
                        value = node;
                    }
                    if (value) lvalues.add(node.name, is_modified(compressor, tw, node, value, 0));
                    if (find_arguments && node instanceof AST_Sub) {
                        scope.each_argname(function(argname) {
                            if (!compressor.option("reduce_vars") || argname.definition().assignments) {
                                if (!argname.definition().fixed) well_defined = false;
                                lvalues.add(argname.name, true);
                            }
                        });
                        find_arguments = false;
                    }
                    if (!scan_toplevel) return;
                    if (node.TYPE == "Call") {
                        if (modify_toplevel) return;
                        var exp = node.expression;
                        if (exp instanceof AST_PropAccess) return;
                        if (exp instanceof AST_LambdaExpression && !exp.contains_this()) return;
                        modify_toplevel = true;
                    } else if (node instanceof AST_PropAccess && may_be_global(node.expression)) {
                        if (node === lhs && !(expr instanceof AST_Unary)) {
                            modify_toplevel = true;
                        } else {
                            read_toplevel = true;
                        }
                    }
                });
                expr.walk(tw);
                return lvalues;
            }

            function remove_candidate(expr) {
                var index = expr.name_index;
                if (index >= 0) {
                    var argname = scope.argnames[index];
                    if (argname instanceof AST_DefaultValue) {
                        argname.value = make_node(AST_Number, argname, {
                            value: 0
                        });
                        argname.name.definition().fixed = false;
                    } else {
                        var args = compressor.parent().args;
                        if (args[index]) {
                            args[index] = make_node(AST_Number, args[index], {
                                value: 0
                            });
                            argname.definition().fixed = false;
                        }
                    }
                    return true;
                }
                var end = hit_stack.length - 1;
                if (hit_stack[end - 1].body === hit_stack[end]) end--;
                var tt = new TreeTransformer(function(node, descend, in_list) {
                    if (hit) return node;
                    if (node !== hit_stack[hit_index]) return node;
                    hit_index++;
                    if (hit_index <= end) return handle_custom_scan_order(node, tt);
                    hit = true;
                    if (node instanceof AST_VarDef) {
                        declare_only[node.name.name] = (declare_only[node.name.name] || 0) + 1;
                        if (value_def) value_def.replaced++;
                        node = node.clone();
                        node.value = null;
                        return node;
                    }
                    return in_list ? List.skip : null;
                }, patch_sequence);
                abort = false;
                hit = false;
                hit_index = 0;
                return statements[stat_index].transform(tt);
            }

            function patch_sequence(node) {
                if (node instanceof AST_Sequence) switch (node.expressions.length) {
                  case 0: return null;
                  case 1: return maintain_this_binding(compressor, this.parent(), node, node.expressions[0]);
                }
            }

            function is_lhs_local(lhs) {
                var sym = root_expr(lhs);
                return sym instanceof AST_SymbolRef
                    && sym.definition().scope.resolve() === scope
                    && !(in_loop
                        && (lvalues.has(sym.name) && lvalues.get(sym.name)[0] !== lhs
                            || candidate instanceof AST_Unary
                            || candidate instanceof AST_Assign && candidate.operator != "="));
            }

            function value_has_side_effects() {
                if (candidate instanceof AST_Unary) return false;
                return rvalue.has_side_effects(compressor);
            }

            function replace_all_symbols(expr) {
                if (expr instanceof AST_Unary) return false;
                if (side_effects) return false;
                if (value_def) return true;
                if (!(lhs instanceof AST_SymbolRef)) return false;
                var referenced;
                if (expr instanceof AST_VarDef) {
                    referenced = 1;
                } else if (expr.operator == "=") {
                    referenced = 2;
                } else {
                    return false;
                }
                var def = lhs.definition();
                return def.references.length - def.replaced == referenced;
            }

            function symbol_in_lvalues(sym, parent) {
                var lvalue = lvalues.get(sym.name);
                if (!lvalue || all(lvalue, function(lhs) {
                    return !lhs;
                })) return;
                if (lvalue[0] !== lhs) return true;
                scan_rhs = false;
            }

            function may_modify(sym) {
                var def = sym.definition();
                if (def.orig.length == 1 && def.orig[0] instanceof AST_SymbolDefun) return false;
                if (def.scope.resolve() !== scope) return true;
                if (modify_toplevel && compressor.exposed(def)) return true;
                return !all(def.references, function(ref) {
                    return ref.scope.resolve() === scope;
                });
            }

            function side_effects_external(node, lhs) {
                if (node instanceof AST_Assign) return side_effects_external(node.left, true);
                if (node instanceof AST_Unary) return side_effects_external(node.expression, true);
                if (node instanceof AST_VarDef) return node.value && side_effects_external(node.value);
                if (lhs) {
                    if (node instanceof AST_Dot) return side_effects_external(node.expression, true);
                    if (node instanceof AST_Sub) return side_effects_external(node.expression, true);
                    if (node instanceof AST_SymbolRef) return node.definition().scope.resolve() !== scope;
                }
                return false;
            }
        }

        function eliminate_spurious_blocks(statements) {
            var seen_dirs = [];
            for (var i = 0; i < statements.length;) {
                var stat = statements[i];
                if (stat instanceof AST_BlockStatement) {
                    if (all(stat.body, safe_to_trim)) {
                        CHANGED = true;
                        eliminate_spurious_blocks(stat.body);
                        [].splice.apply(statements, [i, 1].concat(stat.body));
                        i += stat.body.length;
                        continue;
                    }
                }
                if (stat instanceof AST_Directive) {
                    if (member(stat.value, seen_dirs)) {
                        CHANGED = true;
                        statements.splice(i, 1);
                        continue;
                    }
                    seen_dirs.push(stat.value);
                }
                if (stat instanceof AST_EmptyStatement) {
                    CHANGED = true;
                    statements.splice(i, 1);
                    continue;
                }
                i++;
            }
        }

        function handle_if_return(statements, compressor) {
            var self = compressor.self();
            var parent = compressor.parent();
            var in_lambda = last_of(function(node) {
                return node instanceof AST_Lambda;
            });
            var in_iife = in_lambda && parent && parent.TYPE == "Call";
            var multiple_if_returns = has_multiple_if_returns(statements);
            for (var i = statements.length; --i >= 0;) {
                var stat = statements[i];
                var j = next_index(i);
                var next = statements[j];

                if (in_lambda && !next && stat instanceof AST_Return) {
                    if (!stat.value) {
                        CHANGED = true;
                        statements.splice(i, 1);
                        continue;
                    }
                    var tail = stat.value.tail_node();
                    if (tail instanceof AST_UnaryPrefix && tail.operator == "void") {
                        CHANGED = true;
                        var body;
                        if (tail === stat.value) {
                            body = tail.expression;
                        } else {
                            body = stat.value.clone();
                            body.expressions[body.length - 1] = tail.expression;
                        }
                        statements[i] = make_node(AST_SimpleStatement, stat, {
                            body: body,
                        });
                        continue;
                    }
                }

                if (stat instanceof AST_If) {
                    var ab = aborts(stat.body);
                    if (can_merge_flow(ab)) {
                        if (ab.label) remove(ab.label.thedef.references, ab);
                        CHANGED = true;
                        stat = stat.clone();
                        stat.condition = stat.condition.negate(compressor);
                        var body = as_statement_array_with_return(stat.body, ab);
                        stat.body = make_node(AST_BlockStatement, stat, {
                            body: as_statement_array(stat.alternative).concat(extract_functions())
                        });
                        stat.alternative = make_node(AST_BlockStatement, stat, {
                            body: body
                        });
                        statements[i] = stat;
                        statements[i] = stat.transform(compressor);
                        continue;
                    }

                    if (ab && !stat.alternative && stat.body instanceof AST_BlockStatement && next instanceof AST_Jump) {
                        var negated = stat.condition.negate(compressor);
                        if (negated.print_to_string().length <= stat.condition.print_to_string().length) {
                            CHANGED = true;
                            stat = stat.clone();
                            stat.condition = negated;
                            statements[j] = stat.body;
                            stat.body = next;
                            statements[i] = stat;
                            statements[i] = stat.transform(compressor);
                            continue;
                        }
                    }

                    var alt = aborts(stat.alternative);
                    if (can_merge_flow(alt)) {
                        if (alt.label) remove(alt.label.thedef.references, alt);
                        CHANGED = true;
                        stat = stat.clone();
                        stat.body = make_node(AST_BlockStatement, stat.body, {
                            body: as_statement_array(stat.body).concat(extract_functions())
                        });
                        var body = as_statement_array_with_return(stat.alternative, alt);
                        stat.alternative = make_node(AST_BlockStatement, stat.alternative, {
                            body: body
                        });
                        statements[i] = stat;
                        statements[i] = stat.transform(compressor);
                        continue;
                    }

                    if (compressor.option("typeofs")) {
                        if (ab && !alt) {
                            mark_locally_defined(stat.condition, null, make_node(AST_BlockStatement, self, {
                                body: statements.slice(i + 1)
                            }));
                        }
                        if (!ab && alt) {
                            mark_locally_defined(stat.condition, make_node(AST_BlockStatement, self, {
                                body: statements.slice(i + 1)
                            }));
                        }
                    }
                }

                if (stat instanceof AST_If && stat.body instanceof AST_Return) {
                    var value = stat.body.value;
                    var in_bool = stat.body.in_bool || next instanceof AST_Return && next.in_bool;
                    //---
                    // pretty silly case, but:
                    // if (foo()) return; return; ---> foo(); return;
                    if (!value && !stat.alternative
                        && (in_lambda && !next || next instanceof AST_Return && !next.value)) {
                        CHANGED = true;
                        statements[i] = make_node(AST_SimpleStatement, stat.condition, {
                            body: stat.condition
                        });
                        continue;
                    }
                    //---
                    // if (foo()) return x; return y; ---> return foo() ? x : y;
                    if (!stat.alternative && next instanceof AST_Return) {
                        CHANGED = true;
                        stat = stat.clone();
                        stat.alternative = next;
                        statements.splice(i, 1, stat.transform(compressor));
                        statements.splice(j, 1);
                        continue;
                    }
                    //---
                    // if (foo()) return x; [ return ; ] ---> return foo() ? x : undefined;
                    if (!stat.alternative && !next && in_lambda && (in_bool || value && multiple_if_returns)) {
                        CHANGED = true;
                        stat = stat.clone();
                        stat.alternative = make_node(AST_Return, stat, {
                            value: null
                        });
                        statements.splice(i, 1, stat.transform(compressor));
                        continue;
                    }
                    //---
                    // if (a) return b; if (c) return d; e; ---> return a ? b : c ? d : void e;
                    //
                    // if sequences is not enabled, this can lead to an endless loop (issue #866).
                    // however, with sequences on this helps producing slightly better output for
                    // the example code.
                    var prev = statements[prev_index(i)];
                    if (compressor.option("sequences") && in_lambda && !stat.alternative
                        && (!prev && in_iife || prev instanceof AST_If && prev.body instanceof AST_Return)
                        && next_index(j) == statements.length && next instanceof AST_SimpleStatement) {
                        CHANGED = true;
                        stat = stat.clone();
                        stat.alternative = make_node(AST_BlockStatement, next, {
                            body: [
                                next,
                                make_node(AST_Return, next, {
                                    value: null
                                })
                            ]
                        });
                        statements.splice(i, 1, stat.transform(compressor));
                        statements.splice(j, 1);
                        continue;
                    }
                }
            }

            function has_multiple_if_returns(statements) {
                var n = 0;
                for (var i = statements.length; --i >= 0;) {
                    var stat = statements[i];
                    if (stat instanceof AST_If && stat.body instanceof AST_Return) {
                        if (++n > 1) return true;
                    }
                }
                return false;
            }

            function is_return_void(value) {
                return !value || value instanceof AST_UnaryPrefix && value.operator == "void";
            }

            function last_of(predicate) {
                var block = self, stat, level = 0;
                do {
                    do {
                        if (predicate(block)) return true;
                        block = compressor.parent(level++);
                    } while (block instanceof AST_If && (stat = block));
                } while ((block instanceof AST_BlockStatement || block instanceof AST_Scope)
                    && is_last_statement(block.body, stat));
            }

            function match_target(target) {
                return last_of(function(node) {
                    return node === target;
                });
            }

            function can_drop_abort(ab) {
                if (ab instanceof AST_Return) return in_lambda && is_return_void(ab.value);
                if (!(ab instanceof AST_LoopControl)) return false;
                var lct = compressor.loopcontrol_target(ab);
                if (ab instanceof AST_Continue) return match_target(loop_body(lct));
                if (lct instanceof AST_IterationStatement) return false;
                return match_target(lct);
            }

            function can_merge_flow(ab) {
                if (!can_drop_abort(ab)) return false;
                for (var j = statements.length; --j > i;) {
                    var stat = statements[j];
                    if (stat instanceof AST_DefClass) {
                        if (stat.name.definition().preinit) return false;
                    } else if (stat instanceof AST_Const || stat instanceof AST_Let) {
                        if (!all(stat.definitions, function(defn) {
                            return !defn.name.match_symbol(function(node) {
                                return node instanceof AST_SymbolDeclaration && node.definition().preinit;
                            });
                        })) return false;
                    }
                }
                return true;
            }

            function extract_functions() {
                var defuns = [];
                var lexical = false;
                var tail = statements.splice(i + 1).filter(function(stat) {
                    if (stat instanceof AST_LambdaDefinition) {
                        defuns.push(stat);
                        return false;
                    }
                    if (is_lexical_definition(stat)) lexical = true;
                    return true;
                });
                [].push.apply(lexical ? tail : statements, defuns);
                return tail;
            }

            function as_statement_array_with_return(node, ab) {
                var body = as_statement_array(node);
                var block = body, last;
                while ((last = block[block.length - 1]) !== ab) {
                    block = last.body;
                }
                block.pop();
                if (ab.value) block.push(make_node(AST_SimpleStatement, ab.value, {
                    body: ab.value.expression
                }));
                return body;
            }

            function next_index(i) {
                for (var j = i + 1; j < statements.length; j++) {
                    if (!is_declaration(statements[j])) break;
                }
                return j;
            }

            function prev_index(i) {
                for (var j = i; --j >= 0;) {
                    if (!is_declaration(statements[j])) break;
                }
                return j;
            }
        }

        function eliminate_dead_code(statements, compressor) {
            var has_quit;
            var self = compressor.self();
            for (var i = 0, n = 0, len = statements.length; i < len; i++) {
                var stat = statements[i];
                if (stat instanceof AST_LoopControl) {
                    var lct = compressor.loopcontrol_target(stat);
                    if (stat instanceof AST_Break
                            && !(lct instanceof AST_IterationStatement)
                            && loop_body(lct) === self
                        || stat instanceof AST_Continue
                            && loop_body(lct) === self) {
                        if (stat.label) remove(stat.label.thedef.references, stat);
                    } else {
                        statements[n++] = stat;
                    }
                } else {
                    statements[n++] = stat;
                }
                if (aborts(stat)) {
                    has_quit = statements.slice(i + 1);
                    break;
                }
            }
            statements.length = n;
            CHANGED = n != len;
            if (has_quit) has_quit.forEach(function(stat) {
                extract_declarations_from_unreachable_code(compressor, stat, statements);
            });
        }

        function sequencesize(statements, compressor) {
            if (statements.length < 2) return;
            var seq = [], n = 0;
            function push_seq() {
                if (!seq.length) return;
                var body = make_sequence(seq[0], seq);
                statements[n++] = make_node(AST_SimpleStatement, body, { body: body });
                seq = [];
            }
            for (var i = 0, len = statements.length; i < len; i++) {
                var stat = statements[i];
                if (stat instanceof AST_SimpleStatement) {
                    if (seq.length >= compressor.sequences_limit) push_seq();
                    var body = stat.body;
                    if (seq.length > 0) body = body.drop_side_effect_free(compressor);
                    if (body) merge_sequence(seq, body);
                } else if (is_declaration(stat)) {
                    statements[n++] = stat;
                } else {
                    push_seq();
                    statements[n++] = stat;
                }
            }
            push_seq();
            statements.length = n;
            if (n != len) CHANGED = true;
        }

        function to_simple_statement(block, decls) {
            if (!(block instanceof AST_BlockStatement)) return block;
            var stat = null;
            for (var i = 0; i < block.body.length; i++) {
                var line = block.body[i];
                if (line instanceof AST_Var && declarations_only(line)) {
                    decls.push(line);
                } else if (stat || is_lexical_definition(line)) {
                    return false;
                } else {
                    stat = line;
                }
            }
            return stat;
        }

        function sequencesize_2(statements, compressor) {
            function cons_seq(right) {
                n--;
                CHANGED = true;
                var left = prev.body;
                return make_sequence(left, [ left, right ]);
            }
            var n = 0, prev;
            for (var i = 0; i < statements.length; i++) {
                var stat = statements[i];
                if (prev) {
                    if (stat instanceof AST_Exit) {
                        if (stat.value || !in_async_generator(scope)) {
                            stat.value = cons_seq(stat.value || make_node(AST_Undefined, stat)).optimize(compressor);
                        }
                    } else if (stat instanceof AST_For) {
                        if (!(stat.init instanceof AST_Definitions)) {
                            var abort = false;
                            prev.body.walk(new TreeWalker(function(node) {
                                if (abort || node instanceof AST_Scope) return true;
                                if (node instanceof AST_Binary && node.operator == "in") {
                                    abort = true;
                                    return true;
                                }
                            }));
                            if (!abort) {
                                if (stat.init) stat.init = cons_seq(stat.init);
                                else {
                                    stat.init = prev.body;
                                    n--;
                                    CHANGED = true;
                                }
                            }
                        }
                    } else if (stat instanceof AST_ForIn) {
                        if (!is_lexical_definition(stat.init)) stat.object = cons_seq(stat.object);
                    } else if (stat instanceof AST_If) {
                        stat.condition = cons_seq(stat.condition);
                    } else if (stat instanceof AST_Switch) {
                        stat.expression = cons_seq(stat.expression);
                    } else if (stat instanceof AST_With) {
                        stat.expression = cons_seq(stat.expression);
                    }
                }
                if (compressor.option("conditionals") && stat instanceof AST_If) {
                    var decls = [];
                    var body = to_simple_statement(stat.body, decls);
                    var alt = to_simple_statement(stat.alternative, decls);
                    if (body !== false && alt !== false && decls.length > 0) {
                        var len = decls.length;
                        decls.push(make_node(AST_If, stat, {
                            condition: stat.condition,
                            body: body || make_node(AST_EmptyStatement, stat.body),
                            alternative: alt
                        }));
                        decls.unshift(n, 1);
                        [].splice.apply(statements, decls);
                        i += len;
                        n += len + 1;
                        prev = null;
                        CHANGED = true;
                        continue;
                    }
                }
                statements[n++] = stat;
                prev = stat instanceof AST_SimpleStatement ? stat : null;
            }
            statements.length = n;
        }

        function extract_exprs(body) {
            if (body instanceof AST_Assign) return [ body ];
            if (body instanceof AST_Sequence) return body.expressions.slice();
        }

        function join_assigns(defn, body, keep) {
            var exprs = extract_exprs(body);
            if (!exprs) return;
            var trimmed = false;
            for (var i = exprs.length - 1; --i >= 0;) {
                var expr = exprs[i];
                if (!(expr instanceof AST_Assign)) continue;
                if (expr.operator != "=") continue;
                if (!(expr.left instanceof AST_SymbolRef)) continue;
                var tail = exprs.slice(i + 1);
                if (!trim_assigns(expr.left, expr.right, tail)) continue;
                trimmed = true;
                exprs = exprs.slice(0, i + 1).concat(tail);
            }
            if (defn instanceof AST_Definitions) {
                keep = keep || 0;
                for (var i = defn.definitions.length; --i >= 0;) {
                    var def = defn.definitions[i];
                    if (!def.value) continue;
                    if (trim_assigns(def.name, def.value, exprs)) trimmed = true;
                    if (merge_conditional_assignments(def, exprs, keep)) trimmed = true;
                    break;
                }
                if (defn instanceof AST_Var && join_var_assign(defn.definitions, exprs, keep)) trimmed = true;
            }
            return trimmed && exprs;
        }

        function merge_assigns(prev, defn) {
            if (!(prev instanceof AST_SimpleStatement)) return;
            if (declarations_only(defn)) return;
            var exprs = extract_exprs(prev.body);
            if (!exprs) return;
            var definitions = [];
            if (!join_var_assign(definitions, exprs.reverse(), 0)) return;
            defn.definitions = definitions.reverse().concat(defn.definitions);
            return exprs.reverse();
        }

        function merge_conditional_assignments(var_def, exprs, keep) {
            if (!compressor.option("conditionals")) return;
            if (var_def.name instanceof AST_Destructured) return;
            var trimmed = false;
            var def = var_def.name.definition();
            while (exprs.length > keep) {
                var cond = to_conditional_assignment(compressor, def, var_def.value, exprs[0]);
                if (!cond) break;
                var_def.value = cond;
                exprs.shift();
                trimmed = true;
            }
            return trimmed;
        }

        function join_var_assign(definitions, exprs, keep) {
            var trimmed = false;
            while (exprs.length > keep) {
                var expr = exprs[0];
                if (!(expr instanceof AST_Assign)) break;
                if (expr.operator != "=") break;
                var lhs = expr.left;
                if (!(lhs instanceof AST_SymbolRef)) break;
                if (is_undeclared_ref(lhs)) break;
                if (lhs.scope.resolve() !== scope) break;
                var def = lhs.definition();
                if (def.scope !== scope) break;
                if (def.orig.length > def.eliminated + 1) break;
                if (def.orig[0].TYPE != "SymbolVar") break;
                var name = make_node(AST_SymbolVar, lhs, lhs);
                definitions.push(make_node(AST_VarDef, expr, {
                    name: name,
                    value: expr.right
                }));
                def.orig.push(name);
                def.replaced++;
                exprs.shift();
                trimmed = true;
            }
            return trimmed;
        }

        function trim_assigns(name, value, exprs) {
            if (!(value instanceof AST_Object)) return;
            var trimmed = false;
            do {
                var node = exprs[0];
                if (!(node instanceof AST_Assign)) break;
                if (node.operator != "=") break;
                if (!(node.left instanceof AST_PropAccess)) break;
                var sym = node.left.expression;
                if (!(sym instanceof AST_SymbolRef)) break;
                if (name.name != sym.name) break;
                if (!node.right.is_constant_expression(scope)) break;
                var prop = node.left.property;
                if (prop instanceof AST_Node) {
                    prop = prop.evaluate(compressor);
                }
                if (prop instanceof AST_Node) break;
                prop = "" + prop;
                var diff = prop == "__proto__" || compressor.has_directive("use strict") ? function(node) {
                    var key = node.key;
                    return typeof key == "string" && key != prop && key != "__proto__";
                } : function(node) {
                    var key = node.key;
                    if (node instanceof AST_ObjectGetter || node instanceof AST_ObjectSetter) {
                        return typeof key == "string" && key != prop;
                    }
                    return key !== "__proto__";
                };
                if (!all(value.properties, diff)) break;
                value.properties.push(make_node(AST_ObjectKeyVal, node, {
                    key: prop,
                    value: node.right
                }));
                exprs.shift();
                trimmed = true;
            } while (exprs.length);
            return trimmed;
        }

        function join_consecutive_vars(statements) {
            var defs;
            for (var i = 0, j = -1; i < statements.length; i++) {
                var stat = statements[i];
                var prev = statements[j];
                if (stat instanceof AST_Definitions) {
                    if (prev && prev.TYPE == stat.TYPE) {
                        prev.definitions = prev.definitions.concat(stat.definitions);
                        CHANGED = true;
                    } else if (defs && defs.TYPE == stat.TYPE && declarations_only(stat)) {
                        defs.definitions = defs.definitions.concat(stat.definitions);
                        CHANGED = true;
                    } else if (stat instanceof AST_Var) {
                        var exprs = merge_assigns(prev, stat);
                        if (exprs) {
                            if (exprs.length) {
                                prev.body = make_sequence(prev, exprs);
                                j++;
                            }
                            CHANGED = true;
                        } else {
                            j++;
                        }
                        statements[j] = defs = stat;
                    } else {
                        statements[++j] = stat;
                    }
                    continue;
                } else if (stat instanceof AST_Exit) {
                    stat.value = join_assigns_expr(stat.value);
                } else if (stat instanceof AST_For) {
                    var exprs = join_assigns(prev, stat.init);
                    if (exprs) {
                        CHANGED = true;
                        stat.init = exprs.length ? make_sequence(stat.init, exprs) : null;
                    } else if (prev instanceof AST_Var && (!stat.init || stat.init.TYPE == prev.TYPE)) {
                        if (stat.init) {
                            prev.definitions = prev.definitions.concat(stat.init.definitions);
                        }
                        defs = stat.init = prev;
                        statements[j] = merge_defns(stat);
                        CHANGED = true;
                        continue;
                    } else if (defs && stat.init && defs.TYPE == stat.init.TYPE && declarations_only(stat.init)) {
                        defs.definitions = defs.definitions.concat(stat.init.definitions);
                        stat.init = null;
                        CHANGED = true;
                    } else if (stat.init instanceof AST_Var) {
                        defs = stat.init;
                        exprs = merge_assigns(prev, stat.init);
                        if (exprs) {
                            CHANGED = true;
                            if (exprs.length == 0) {
                                statements[j] = merge_defns(stat);
                                continue;
                            }
                            prev.body = make_sequence(prev, exprs);
                        }
                    }
                } else if (stat instanceof AST_ForEnumeration) {
                    if (defs && defs.TYPE == stat.init.TYPE) {
                        var defns = defs.definitions.slice();
                        stat.init = stat.init.definitions[0].name.convert_symbol(AST_SymbolRef, function(ref, name) {
                            defns.push(make_node(AST_VarDef, name, {
                                name: name,
                                value: null,
                            }));
                            name.definition().references.push(ref);
                        });
                        defs.definitions = defns;
                        CHANGED = true;
                    }
                    stat.object = join_assigns_expr(stat.object);
                } else if (stat instanceof AST_If) {
                    stat.condition = join_assigns_expr(stat.condition);
                } else if (stat instanceof AST_SimpleStatement) {
                    var exprs = join_assigns(prev, stat.body);
                    if (exprs) {
                        CHANGED = true;
                        if (!exprs.length) continue;
                        stat.body = make_sequence(stat.body, exprs);
                    }
                } else if (stat instanceof AST_Switch) {
                    stat.expression = join_assigns_expr(stat.expression);
                } else if (stat instanceof AST_With) {
                    stat.expression = join_assigns_expr(stat.expression);
                }
                statements[++j] = defs ? merge_defns(stat) : stat;
            }
            statements.length = j + 1;

            function join_assigns_expr(value) {
                var exprs = join_assigns(prev, value, 1);
                if (!exprs) return value;
                CHANGED = true;
                var tail = value.tail_node();
                if (exprs[exprs.length - 1] !== tail) exprs.push(tail.left);
                return make_sequence(value, exprs);
            }

            function merge_defns(stat) {
                return stat.transform(new TreeTransformer(function(node, descend, in_list) {
                    if (node instanceof AST_Definitions) {
                        if (defs === node) return node;
                        if (defs.TYPE != node.TYPE) return node;
                        var parent = this.parent();
                        if (parent instanceof AST_ForEnumeration && parent.init === node) return node;
                        if (!declarations_only(node)) return node;
                        defs.definitions = defs.definitions.concat(node.definitions);
                        CHANGED = true;
                        if (parent instanceof AST_For && parent.init === node) return null;
                        return in_list ? List.skip : make_node(AST_EmptyStatement, node);
                    }
                    if (node instanceof AST_ExportDeclaration) return node;
                    if (node instanceof AST_Scope) return node;
                    if (!is_statement(node)) return node;
                }));
            }
        }
    }

    function extract_declarations_from_unreachable_code(compressor, stat, target) {
        if (!(stat instanceof AST_DefClass
            || stat instanceof AST_Definitions
            || stat instanceof AST_LambdaDefinition)) {
            AST_Node.warn("Dropping unreachable code [{file}:{line},{col}]", stat.start);
        }
        var block;
        stat.walk(new TreeWalker(function(node, descend) {
            if (node instanceof AST_DefClass) {
                node.extends = null;
                node.properties = [];
                push(node);
                return true;
            }
            if (node instanceof AST_Definitions) {
                var defns = [];
                if (node.remove_initializers(compressor, defns)) {
                    AST_Node.warn("Dropping initialization in unreachable code [{file}:{line},{col}]", node.start);
                }
                if (defns.length > 0) {
                    node.definitions = defns;
                    push(node);
                }
                return true;
            }
            if (node instanceof AST_LambdaDefinition) {
                push(node);
                return true;
            }
            if (node instanceof AST_Scope) return true;
            if (node instanceof AST_BlockScope) {
                var save = block;
                block = [];
                descend();
                if (block.required) {
                    target.push(make_node(AST_BlockStatement, stat, {
                        body: block
                    }));
                } else if (block.length) {
                    [].push.apply(target, block);
                }
                block = save;
                return true;
            }
        }));
        function push(node) {
            if (block) {
                block.push(node);
                if (!safe_to_trim(node)) block.required = true;
            } else {
                target.push(node);
            }
        }
    }

    function is_undefined(node, compressor) {
        return node.is_undefined
            || node instanceof AST_Undefined
            || node instanceof AST_UnaryPrefix
                && node.operator == "void"
                && !(compressor && node.expression.has_side_effects(compressor));
    }

    // is_truthy()
    // return true if `!!node === true`
    (function(def) {
        def(AST_Node, return_false);
        def(AST_Array, return_true);
        def(AST_Assign, function() {
            return this.operator == "=" && this.right.is_truthy();
        });
        def(AST_Lambda, return_true);
        def(AST_Object, return_true);
        def(AST_RegExp, return_true);
        def(AST_Sequence, function() {
            return this.tail_node().is_truthy();
        });
        def(AST_SymbolRef, function() {
            var fixed = this.fixed_value();
            if (!fixed) return false;
            this.is_truthy = return_false;
            var result = fixed.is_truthy();
            delete this.is_truthy;
            return result;
        });
    })(function(node, func) {
        node.DEFMETHOD("is_truthy", func);
    });

    // is_negative_zero()
    // return true if the node may represent -0
    (function(def) {
        def(AST_Node, return_true);
        def(AST_Array, return_false);
        function binary(op, left, right) {
            switch (op) {
              case "-":
                return left.is_negative_zero()
                    && (!(right instanceof AST_Constant) || right.value == 0);
              case "&&":
              case "||":
                return left.is_negative_zero() || right.is_negative_zero();
              case "*":
              case "/":
              case "%":
              case "**":
                return true;
              default:
                return false;
            }
        }
        def(AST_Assign, function() {
            var op = this.operator;
            if (op == "=") return this.right.is_negative_zero();
            return binary(op.slice(0, -1), this.left, this.right);
        });
        def(AST_Binary, function() {
            return binary(this.operator, this.left, this.right);
        });
        def(AST_Constant, function() {
            return this.value == 0 && 1 / this.value < 0;
        });
        def(AST_Lambda, return_false);
        def(AST_Object, return_false);
        def(AST_RegExp, return_false);
        def(AST_Sequence, function() {
            return this.tail_node().is_negative_zero();
        });
        def(AST_SymbolRef, function() {
            var fixed = this.fixed_value();
            if (!fixed) return true;
            this.is_negative_zero = return_true;
            var result = fixed.is_negative_zero();
            delete this.is_negative_zero;
            return result;
        });
        def(AST_UnaryPrefix, function() {
            return this.operator == "+" && this.expression.is_negative_zero()
                || this.operator == "-";
        });
    })(function(node, func) {
        node.DEFMETHOD("is_negative_zero", func);
    });

    // may_throw_on_access()
    // returns true if this node may be null, undefined or contain `AST_Accessor`
    (function(def) {
        AST_Node.DEFMETHOD("may_throw_on_access", function(compressor, force) {
            return !compressor.option("pure_getters") || this._dot_throw(compressor, force);
        });
        function is_strict(compressor, force) {
            return force || /strict/.test(compressor.option("pure_getters"));
        }
        def(AST_Node, is_strict);
        def(AST_Array, return_false);
        def(AST_Assign, function(compressor) {
            var op = this.operator;
            var sym = this.left;
            var rhs = this.right;
            if (op != "=") {
                return lazy_op[op.slice(0, -1)] && (sym._dot_throw(compressor) || rhs._dot_throw(compressor));
            }
            if (!rhs._dot_throw(compressor)) return false;
            if (!(sym instanceof AST_SymbolRef)) return true;
            if (rhs instanceof AST_Binary && rhs.operator == "||" && sym.name == rhs.left.name) {
                return rhs.right._dot_throw(compressor);
            }
            return true;
        });
        def(AST_Binary, function(compressor) {
            return lazy_op[this.operator] && (this.left._dot_throw(compressor) || this.right._dot_throw(compressor));
        });
        def(AST_Class, return_false);
        def(AST_Conditional, function(compressor) {
            return this.consequent._dot_throw(compressor) || this.alternative._dot_throw(compressor);
        });
        def(AST_Constant, return_false);
        def(AST_Dot, function(compressor, force) {
            if (!is_strict(compressor, force)) return false;
            var exp = this.expression;
            if (exp instanceof AST_SymbolRef) exp = exp.fixed_value();
            return !(this.property == "prototype" && is_lambda(exp));
        });
        def(AST_Lambda, return_false);
        def(AST_Null, return_true);
        def(AST_Object, function(compressor, force) {
            return is_strict(compressor, force) && !all(this.properties, function(prop) {
                if (!(prop instanceof AST_ObjectKeyVal)) return false;
                return !(prop.key === "__proto__" && prop.value._dot_throw(compressor, force));
            });
        });
        def(AST_ObjectIdentity, function(compressor, force) {
            return is_strict(compressor, force) && !this.scope.resolve().new;
        });
        def(AST_Sequence, function(compressor) {
            return this.tail_node()._dot_throw(compressor);
        });
        def(AST_SymbolRef, function(compressor, force) {
            if (this.is_undefined) return true;
            if (!is_strict(compressor, force)) return false;
            if (is_undeclared_ref(this) && this.is_declared(compressor)) return false;
            if (this.is_immutable()) return false;
            var def = this.definition();
            if (is_arguments(def) && !def.scope.rest && all(def.scope.argnames, function(argname) {
                return argname instanceof AST_SymbolFunarg;
            })) return def.scope.uses_arguments > 2;
            var fixed = this.fixed_value();
            if (!fixed) return true;
            this._dot_throw = return_true;
            if (fixed._dot_throw(compressor)) {
                delete this._dot_throw;
                return true;
            }
            this._dot_throw = return_false;
            return false;
        });
        def(AST_UnaryPrefix, function() {
            return this.operator == "void";
        });
        def(AST_UnaryPostfix, return_false);
        def(AST_Undefined, return_true);
    })(function(node, func) {
        node.DEFMETHOD("_dot_throw", func);
    });

    (function(def) {
        def(AST_Node, return_false);
        def(AST_Array, return_true);
        function is_binary_defined(compressor, op, node) {
            switch (op) {
              case "&&":
                return node.left.is_defined(compressor) && node.right.is_defined(compressor);
              case "||":
                return node.left.is_truthy() || node.right.is_defined(compressor);
              case "??":
                return node.left.is_defined(compressor) || node.right.is_defined(compressor);
              default:
                return true;
            }
        }
        def(AST_Assign, function(compressor) {
            var op = this.operator;
            if (op == "=") return this.right.is_defined(compressor);
            return is_binary_defined(compressor, op.slice(0, -1), this);
        });
        def(AST_Binary, function(compressor) {
            return is_binary_defined(compressor, this.operator, this);
        });
        def(AST_Conditional, function(compressor) {
            return this.consequent.is_defined(compressor) && this.alternative.is_defined(compressor);
        });
        def(AST_Constant, return_true);
        def(AST_Hole, return_false);
        def(AST_Lambda, return_true);
        def(AST_Object, return_true);
        def(AST_Sequence, function(compressor) {
            return this.tail_node().is_defined(compressor);
        });
        def(AST_SymbolRef, function(compressor) {
            if (this.is_undefined) return false;
            if (is_undeclared_ref(this) && this.is_declared(compressor)) return true;
            if (this.is_immutable()) return true;
            var fixed = this.fixed_value();
            if (!fixed) return false;
            this.is_defined = return_false;
            var result = fixed.is_defined(compressor);
            delete this.is_defined;
            return result;
        });
        def(AST_UnaryPrefix, function() {
            return this.operator != "void";
        });
        def(AST_UnaryPostfix, return_true);
        def(AST_Undefined, return_false);
    })(function(node, func) {
        node.DEFMETHOD("is_defined", func);
    });

    /* -----[ boolean/negation helpers ]----- */

    // methods to determine whether an expression has a boolean result type
    (function(def) {
        def(AST_Node, return_false);
        def(AST_Assign, function(compressor) {
            return this.operator == "=" && this.right.is_boolean(compressor);
        });
        var binary = makePredicate("in instanceof == != === !== < <= >= >");
        def(AST_Binary, function(compressor) {
            return binary[this.operator] || lazy_op[this.operator]
                && this.left.is_boolean(compressor)
                && this.right.is_boolean(compressor);
        });
        def(AST_Boolean, return_true);
        var fn = makePredicate("every hasOwnProperty isPrototypeOf propertyIsEnumerable some");
        def(AST_Call, function(compressor) {
            if (!compressor.option("unsafe")) return false;
            var exp = this.expression;
            return exp instanceof AST_Dot && (fn[exp.property]
                || exp.property == "test" && exp.expression instanceof AST_RegExp);
        });
        def(AST_Conditional, function(compressor) {
            return this.consequent.is_boolean(compressor) && this.alternative.is_boolean(compressor);
        });
        def(AST_New, return_false);
        def(AST_Sequence, function(compressor) {
            return this.tail_node().is_boolean(compressor);
        });
        def(AST_SymbolRef, function(compressor) {
            var fixed = this.fixed_value();
            if (!fixed) return false;
            this.is_boolean = return_false;
            var result = fixed.is_boolean(compressor);
            delete this.is_boolean;
            return result;
        });
        var unary = makePredicate("! delete");
        def(AST_UnaryPrefix, function() {
            return unary[this.operator];
        });
    })(function(node, func) {
        node.DEFMETHOD("is_boolean", func);
    });

    // methods to determine if an expression has a numeric result type
    (function(def) {
        def(AST_Node, return_false);
        var binary = makePredicate("- * / % ** & | ^ << >> >>>");
        def(AST_Assign, function(compressor) {
            return binary[this.operator.slice(0, -1)]
                || this.operator == "=" && this.right.is_number(compressor);
        });
        def(AST_Binary, function(compressor) {
            if (binary[this.operator]) return true;
            if (this.operator != "+") return false;
            return (this.left.is_boolean(compressor) || this.left.is_number(compressor))
                && (this.right.is_boolean(compressor) || this.right.is_number(compressor));
        });
        var fn = makePredicate([
            "charCodeAt",
            "getDate",
            "getDay",
            "getFullYear",
            "getHours",
            "getMilliseconds",
            "getMinutes",
            "getMonth",
            "getSeconds",
            "getTime",
            "getTimezoneOffset",
            "getUTCDate",
            "getUTCDay",
            "getUTCFullYear",
            "getUTCHours",
            "getUTCMilliseconds",
            "getUTCMinutes",
            "getUTCMonth",
            "getUTCSeconds",
            "getYear",
            "indexOf",
            "lastIndexOf",
            "localeCompare",
            "push",
            "search",
            "setDate",
            "setFullYear",
            "setHours",
            "setMilliseconds",
            "setMinutes",
            "setMonth",
            "setSeconds",
            "setTime",
            "setUTCDate",
            "setUTCFullYear",
            "setUTCHours",
            "setUTCMilliseconds",
            "setUTCMinutes",
            "setUTCMonth",
            "setUTCSeconds",
            "setYear",
            "toExponential",
            "toFixed",
            "toPrecision",
        ]);
        def(AST_Call, function(compressor) {
            if (!compressor.option("unsafe")) return false;
            var exp = this.expression;
            return exp instanceof AST_Dot && (fn[exp.property]
                || is_undeclared_ref(exp.expression) && exp.expression.name == "Math");
        });
        def(AST_Conditional, function(compressor) {
            return this.consequent.is_number(compressor) && this.alternative.is_number(compressor);
        });
        def(AST_New, return_false);
        def(AST_Number, return_true);
        def(AST_Sequence, function(compressor) {
            return this.tail_node().is_number(compressor);
        });
        def(AST_SymbolRef, function(compressor) {
            var fixed = this.fixed_value();
            if (!fixed) return false;
            this.is_number = return_false;
            var result = fixed.is_number(compressor);
            delete this.is_number;
            return result;
        });
        var unary = makePredicate("+ - ~ ++ --");
        def(AST_Unary, function() {
            return unary[this.operator];
        });
    })(function(node, func) {
        node.DEFMETHOD("is_number", func);
    });

    // methods to determine if an expression has a string result type
    (function(def) {
        def(AST_Node, return_false);
        def(AST_Assign, function(compressor) {
            switch (this.operator) {
              case "+=":
                if (this.left.is_string(compressor)) return true;
              case "=":
                return this.right.is_string(compressor);
            }
        });
        def(AST_Binary, function(compressor) {
            return this.operator == "+" &&
                (this.left.is_string(compressor) || this.right.is_string(compressor));
        });
        var fn = makePredicate([
            "charAt",
            "substr",
            "substring",
            "toLowerCase",
            "toString",
            "toUpperCase",
            "trim",
        ]);
        def(AST_Call, function(compressor) {
            if (!compressor.option("unsafe")) return false;
            var exp = this.expression;
            return exp instanceof AST_Dot && fn[exp.property];
        });
        def(AST_Conditional, function(compressor) {
            return this.consequent.is_string(compressor) && this.alternative.is_string(compressor);
        });
        def(AST_Sequence, function(compressor) {
            return this.tail_node().is_string(compressor);
        });
        def(AST_String, return_true);
        def(AST_SymbolRef, function(compressor) {
            var fixed = this.fixed_value();
            if (!fixed) return false;
            this.is_string = return_false;
            var result = fixed.is_string(compressor);
            delete this.is_string;
            return result;
        });
        def(AST_Template, function(compressor) {
            return !this.tag || is_raw_tag(compressor, this.tag);
        });
        def(AST_UnaryPrefix, function() {
            return this.operator == "typeof";
        });
    })(function(node, func) {
        node.DEFMETHOD("is_string", func);
    });

    var lazy_op = makePredicate("&& || ??");

    (function(def) {
        function to_node(value, orig) {
            if (value instanceof AST_Node) return value.clone(true);
            if (Array.isArray(value)) return make_node(AST_Array, orig, {
                elements: value.map(function(value) {
                    return to_node(value, orig);
                })
            });
            if (value && typeof value == "object") {
                var props = [];
                for (var key in value) if (HOP(value, key)) {
                    props.push(make_node(AST_ObjectKeyVal, orig, {
                        key: key,
                        value: to_node(value[key], orig)
                    }));
                }
                return make_node(AST_Object, orig, {
                    properties: props
                });
            }
            return make_node_from_constant(value, orig);
        }

        function warn(node) {
            AST_Node.warn("global_defs {node} redefined [{file}:{line},{col}]", {
                node: node,
                file: node.start.file,
                line: node.start.line,
                col: node.start.col,
            });
        }

        AST_Toplevel.DEFMETHOD("resolve_defines", function(compressor) {
            if (!compressor.option("global_defs")) return this;
            this.figure_out_scope({ ie: compressor.option("ie") });
            return this.transform(new TreeTransformer(function(node) {
                var def = node._find_defs(compressor, "");
                if (!def) return;
                var level = 0, child = node, parent;
                while (parent = this.parent(level++)) {
                    if (!(parent instanceof AST_PropAccess)) break;
                    if (parent.expression !== child) break;
                    child = parent;
                }
                if (is_lhs(child, parent)) {
                    warn(node);
                    return;
                }
                return def;
            }));
        });
        def(AST_Node, noop);
        def(AST_Dot, function(compressor, suffix) {
            return this.expression._find_defs(compressor, "." + this.property + suffix);
        });
        def(AST_SymbolDeclaration, function(compressor) {
            if (!this.definition().global) return;
            if (HOP(compressor.option("global_defs"), this.name)) warn(this);
        });
        def(AST_SymbolRef, function(compressor, suffix) {
            if (!this.definition().global) return;
            var defines = compressor.option("global_defs");
            var name = this.name + suffix;
            if (HOP(defines, name)) return to_node(defines[name], this);
        });
    })(function(node, func) {
        node.DEFMETHOD("_find_defs", func);
    });

    function best_of_expression(ast1, ast2, threshold) {
        var delta = ast2.print_to_string().length - ast1.print_to_string().length;
        return delta < (threshold || 0) ? ast2 : ast1;
    }

    function best_of_statement(ast1, ast2, threshold) {
        return best_of_expression(make_node(AST_SimpleStatement, ast1, {
            body: ast1
        }), make_node(AST_SimpleStatement, ast2, {
            body: ast2
        }), threshold).body;
    }

    function best_of(compressor, ast1, ast2, threshold) {
        return (first_in_statement(compressor) ? best_of_statement : best_of_expression)(ast1, ast2, threshold);
    }

    function convert_to_predicate(obj) {
        var map = Object.create(null);
        Object.keys(obj).forEach(function(key) {
            map[key] = makePredicate(obj[key]);
        });
        return map;
    }

    function skip_directives(body) {
        for (var i = 0; i < body.length; i++) {
            var stat = body[i];
            if (!(stat instanceof AST_Directive)) return stat;
        }
    }

    function arrow_first_statement() {
        if (this.value) return make_node(AST_Return, this.value, {
            value: this.value
        });
        return skip_directives(this.body);
    }
    AST_Arrow.DEFMETHOD("first_statement", arrow_first_statement);
    AST_AsyncArrow.DEFMETHOD("first_statement", arrow_first_statement);
    AST_Lambda.DEFMETHOD("first_statement", function() {
        return skip_directives(this.body);
    });

    AST_Lambda.DEFMETHOD("length", function() {
        var argnames = this.argnames;
        for (var i = 0; i < argnames.length; i++) {
            if (argnames[i] instanceof AST_DefaultValue) break;
        }
        return i;
    });

    function try_evaluate(compressor, node) {
        var ev = node.evaluate(compressor);
        if (ev === node) return node;
        ev = make_node_from_constant(ev, node).optimize(compressor);
        return best_of(compressor, node, ev, compressor.eval_threshold);
    }

    var object_fns = [
        "constructor",
        "toString",
        "valueOf",
    ];
    var native_fns = convert_to_predicate({
        Array: [
            "indexOf",
            "join",
            "lastIndexOf",
            "slice",
        ].concat(object_fns),
        Boolean: object_fns,
        Function: object_fns,
        Number: [
            "toExponential",
            "toFixed",
            "toPrecision",
        ].concat(object_fns),
        Object: object_fns,
        RegExp: [
            "exec",
            "test",
        ].concat(object_fns),
        String: [
            "charAt",
            "charCodeAt",
            "concat",
            "indexOf",
            "italics",
            "lastIndexOf",
            "match",
            "replace",
            "search",
            "slice",
            "split",
            "substr",
            "substring",
            "toLowerCase",
            "toUpperCase",
            "trim",
        ].concat(object_fns),
    });
    var static_fns = convert_to_predicate({
        Array: [
            "isArray",
        ],
        Math: [
            "abs",
            "acos",
            "asin",
            "atan",
            "ceil",
            "cos",
            "exp",
            "floor",
            "log",
            "round",
            "sin",
            "sqrt",
            "tan",
            "atan2",
            "pow",
            "max",
            "min",
        ],
        Number: [
            "isFinite",
            "isNaN",
        ],
        Object: [
            "create",
            "getOwnPropertyDescriptor",
            "getOwnPropertyNames",
            "getPrototypeOf",
            "isExtensible",
            "isFrozen",
            "isSealed",
            "keys",
        ],
        String: [
            "fromCharCode",
            "raw",
        ],
    });

    function is_static_fn(node) {
        if (!(node instanceof AST_Dot)) return false;
        var expr = node.expression;
        if (!is_undeclared_ref(expr)) return false;
        var static_fn = static_fns[expr.name];
        return static_fn && (static_fn[node.property] || expr.name == "Math" && node.property == "random");
    }

    // Accomodate when compress option evaluate=false
    // as well as the common constant expressions !0 and -1
    (function(def) {
        def(AST_Node, return_false);
        def(AST_Constant, return_true);
        def(AST_RegExp, return_false);
        var unaryPrefix = makePredicate("! ~ - + void");
        def(AST_UnaryPrefix, function() {
            return unaryPrefix[this.operator] && this.expression instanceof AST_Constant;
        });
    })(function(node, func) {
        node.DEFMETHOD("is_constant", func);
    });

    // methods to evaluate a constant expression
    (function(def) {
        // If the node has been successfully reduced to a constant,
        // then its value is returned; otherwise the element itself
        // is returned.
        //
        // They can be distinguished as constant value is never a
        // descendant of AST_Node.
        //
        // When `ignore_side_effects` is `true`, inspect the constant value
        // produced without worrying about any side effects caused by said
        // expression.
        AST_Node.DEFMETHOD("evaluate", function(compressor, ignore_side_effects) {
            if (!compressor.option("evaluate")) return this;
            var cached = [];
            var val = this._eval(compressor, ignore_side_effects, cached, 1);
            cached.forEach(function(node) {
                delete node._eval;
            });
            if (ignore_side_effects) return val;
            if (!val || val instanceof RegExp) return val;
            if (typeof val == "function" || typeof val == "object") return this;
            return val;
        });
        var scan_modified = new TreeWalker(function(node) {
            if (node instanceof AST_Assign) modified(node.left);
            if (node instanceof AST_Unary && UNARY_POSTFIX[node.operator]) modified(node.expression);
        });
        function modified(node) {
            if (node instanceof AST_DestructuredArray) {
                node.elements.forEach(modified);
            } else if (node instanceof AST_DestructuredObject) {
                node.properties.forEach(function(prop) {
                    modified(prop.value);
                });
            } else if (node instanceof AST_PropAccess) {
                modified(node.expression);
            } else if (node instanceof AST_SymbolRef) {
                node.definition().references.forEach(function(ref) {
                    delete ref._eval;
                });
            }
        }
        def(AST_Statement, function() {
            throw new Error(string_template("Cannot evaluate a statement [{file}:{line},{col}]", this.start));
        });
        def(AST_Accessor, return_this);
        def(AST_BigInt, return_this);
        def(AST_Class, return_this);
        def(AST_Node, return_this);
        def(AST_Constant, function() {
            return this.value;
        });
        def(AST_Assign, function(compressor, ignore_side_effects, cached, depth) {
            var lhs = this.left;
            if (!ignore_side_effects) {
                if (!(lhs instanceof AST_SymbolRef)) return this;
                if (!HOP(lhs, "_eval")) {
                    if (!lhs.fixed) return this;
                    var def = lhs.definition();
                    if (!def.fixed) return this;
                    if (def.undeclared) return this;
                    if (def.last_ref !== lhs) return this;
                    if (def.single_use == "m") return this;
                }
            }
            var op = this.operator;
            var node;
            if (!HOP(lhs, "_eval") && lhs instanceof AST_SymbolRef && lhs.fixed && lhs.definition().fixed) {
                node = lhs;
            } else if (op == "=") {
                node = this.right;
            } else {
                node = make_node(AST_Binary, this, {
                    operator: op.slice(0, -1),
                    left: lhs,
                    right: this.right,
                });
            }
            lhs.walk(scan_modified);
            var value = node._eval(compressor, ignore_side_effects, cached, depth);
            if (typeof value == "object") return this;
            modified(lhs);
            return value;
        });
        def(AST_Sequence, function(compressor, ignore_side_effects, cached, depth) {
            if (!ignore_side_effects) return this;
            var exprs = this.expressions;
            for (var i = 0, last = exprs.length - 1; i < last; i++) {
                exprs[i].walk(scan_modified);
            }
            var tail = exprs[last];
            var value = tail._eval(compressor, ignore_side_effects, cached, depth);
            return value === tail ? this : value;
        });
        def(AST_Lambda, function(compressor) {
            if (compressor.option("unsafe")) {
                var fn = function() {};
                fn.node = this;
                fn.toString = function() {
                    return "function(){}";
                };
                return fn;
            }
            return this;
        });
        def(AST_Array, function(compressor, ignore_side_effects, cached, depth) {
            if (compressor.option("unsafe")) {
                var elements = [];
                for (var i = 0; i < this.elements.length; i++) {
                    var element = this.elements[i];
                    if (element instanceof AST_Hole) return this;
                    var value = element._eval(compressor, ignore_side_effects, cached, depth);
                    if (element === value) return this;
                    elements.push(value);
                }
                return elements;
            }
            return this;
        });
        var nonsafe_props = makePredicate("__proto__ toString valueOf");
        def(AST_Object, function(compressor, ignore_side_effects, cached, depth) {
            if (compressor.option("unsafe")) {
                var val = {};
                for (var i = 0; i < this.properties.length; i++) {
                    var prop = this.properties[i];
                    if (!(prop instanceof AST_ObjectKeyVal)) return this;
                    var key = prop.key;
                    if (key instanceof AST_Node) {
                        key = key._eval(compressor, ignore_side_effects, cached, depth);
                        if (key === prop.key) return this;
                    }
                    if (nonsafe_props[key]) return this;
                    val[key] = prop.value._eval(compressor, ignore_side_effects, cached, depth);
                    if (val[key] === prop.value) return this;
                }
                return val;
            }
            return this;
        });
        var non_converting_unary = makePredicate("! typeof void");
        def(AST_UnaryPrefix, function(compressor, ignore_side_effects, cached, depth) {
            var e = this.expression;
            var op = this.operator;
            // Function would be evaluated to an array and so typeof would
            // incorrectly return "object". Hence making is a special case.
            if (compressor.option("typeofs")
                && op == "typeof"
                && (e instanceof AST_Lambda
                    || e instanceof AST_SymbolRef
                        && e.fixed_value() instanceof AST_Lambda)) {
                return typeof function(){};
            }
            var def = e instanceof AST_SymbolRef && e.definition();
            if (!non_converting_unary[op] && !(def && def.fixed)) depth++;
            e.walk(scan_modified);
            var v = e._eval(compressor, ignore_side_effects, cached, depth);
            if (v === e) {
                if (ignore_side_effects && op == "void") return;
                return this;
            }
            switch (op) {
              case "!": return !v;
              case "typeof":
                // typeof <RegExp> returns "object" or "function" on different platforms
                // so cannot evaluate reliably
                if (v instanceof RegExp) return this;
                return typeof v;
              case "void": return;
              case "~": return ~v;
              case "-": return -v;
              case "+": return +v;
              case "++":
              case "--":
                if (!def) return this;
                if (!ignore_side_effects) {
                    if (def.undeclared) return this;
                    if (def.last_ref !== e) return this;
                }
                if (HOP(e, "_eval")) v = +(op[0] + 1) + +v;
                modified(e);
                return v;
            }
            return this;
        });
        def(AST_UnaryPostfix, function(compressor, ignore_side_effects, cached, depth) {
            var e = this.expression;
            if (!(e instanceof AST_SymbolRef)) {
                if (!ignore_side_effects) return this;
            } else if (!HOP(e, "_eval")) {
                if (!e.fixed) return this;
                if (!ignore_side_effects) {
                    var def = e.definition();
                    if (!def.fixed) return this;
                    if (def.undeclared) return this;
                    if (def.last_ref !== e) return this;
                }
            }
            if (!(e instanceof AST_SymbolRef && e.definition().fixed)) depth++;
            e.walk(scan_modified);
            var v = e._eval(compressor, ignore_side_effects, cached, depth);
            if (v === e) return this;
            modified(e);
            return +v;
        });
        var non_converting_binary = makePredicate("&& || === !==");
        def(AST_Binary, function(compressor, ignore_side_effects, cached, depth) {
            if (!non_converting_binary[this.operator]) depth++;
            var left = this.left._eval(compressor, ignore_side_effects, cached, depth);
            if (left === this.left) return this;
            if (this.operator == (left ? "||" : "&&")) return left;
            var rhs_ignore_side_effects = ignore_side_effects && !(left && typeof left == "object");
            var right = this.right._eval(compressor, rhs_ignore_side_effects, cached, depth);
            if (right === this.right) return this;
            var result;
            switch (this.operator) {
              case "&&" : result = left &&  right; break;
              case "||" : result = left ||  right; break;
              case "??" :
                result = left == null ? right : left;
                break;
              case "|"  : result = left |   right; break;
              case "&"  : result = left &   right; break;
              case "^"  : result = left ^   right; break;
              case "+"  : result = left +   right; break;
              case "-"  : result = left -   right; break;
              case "*"  : result = left *   right; break;
              case "/"  : result = left /   right; break;
              case "%"  : result = left %   right; break;
              case "<<" : result = left <<  right; break;
              case ">>" : result = left >>  right; break;
              case ">>>": result = left >>> right; break;
              case "==" : result = left ==  right; break;
              case "===": result = left === right; break;
              case "!=" : result = left !=  right; break;
              case "!==": result = left !== right; break;
              case "<"  : result = left <   right; break;
              case "<=" : result = left <=  right; break;
              case ">"  : result = left >   right; break;
              case ">=" : result = left >=  right; break;
              case "**":
                result = Math.pow(left, right);
                break;
              case "in":
                if (right && typeof right == "object" && HOP(right, left)) {
                    result = true;
                    break;
                }
              default:
                return this;
            }
            if (isNaN(result)) return compressor.find_parent(AST_With) ? this : result;
            if (compressor.option("unsafe_math")
                && !ignore_side_effects
                && result
                && typeof result == "number"
                && (this.operator == "+" || this.operator == "-")) {
                var digits = Math.max(0, decimals(left), decimals(right));
                // 53-bit significand ---> 15.95 decimal places
                if (digits < 16) return +result.toFixed(digits);
            }
            return result;

            function decimals(operand) {
                var match = /(\.[0-9]*)?(e.+)?$/.exec(+operand);
                return (match[1] || ".").length - 1 - (match[2] || "").slice(1);
            }
        });
        def(AST_Conditional, function(compressor, ignore_side_effects, cached, depth) {
            var condition = this.condition._eval(compressor, ignore_side_effects, cached, depth);
            if (condition === this.condition) return this;
            var node = condition ? this.consequent : this.alternative;
            var value = node._eval(compressor, ignore_side_effects, cached, depth);
            return value === node ? this : value;
        });
        function verify_escaped(ref, depth) {
            var escaped = ref.definition().escaped;
            switch (escaped.length) {
              case 0:
                return true;
              case 1:
                var found = false;
                escaped[0].walk(new TreeWalker(function(node) {
                    if (found) return true;
                    if (node === ref) return found = true;
                    if (node instanceof AST_Scope) return true;
                }));
                return found;
              default:
                return depth <= escaped.depth;
            }
        }
        def(AST_SymbolRef, function(compressor, ignore_side_effects, cached, depth) {
            var fixed = this.fixed_value();
            if (!fixed) return this;
            var value;
            if (HOP(fixed, "_eval")) {
                value = fixed._eval();
            } else {
                this._eval = return_this;
                value = fixed._eval(compressor, ignore_side_effects, cached, depth);
                delete this._eval;
                if (value === fixed) return this;
                fixed._eval = function() {
                    return value;
                };
                cached.push(fixed);
            }
            return value && typeof value == "object" && !verify_escaped(this, depth) ? this : value;
        });
        var global_objs = {
            Array: Array,
            Math: Math,
            Number: Number,
            Object: Object,
            String: String,
        };
        var static_values = convert_to_predicate({
            Math: [
                "E",
                "LN10",
                "LN2",
                "LOG2E",
                "LOG10E",
                "PI",
                "SQRT1_2",
                "SQRT2",
            ],
            Number: [
                "MAX_VALUE",
                "MIN_VALUE",
                "NaN",
                "NEGATIVE_INFINITY",
                "POSITIVE_INFINITY",
            ],
        });
        var regexp_props = makePredicate("global ignoreCase multiline source");
        def(AST_PropAccess, function(compressor, ignore_side_effects, cached, depth) {
            if (compressor.option("unsafe")) {
                var val;
                var exp = this.expression;
                if (!is_undeclared_ref(exp)) {
                    val = exp._eval(compressor, ignore_side_effects, cached, depth + 1);
                    if (val == null || val === exp) return this;
                }
                var key = this.property;
                if (key instanceof AST_Node) {
                    key = key._eval(compressor, ignore_side_effects, cached, depth);
                    if (key === this.property) return this;
                }
                if (val === undefined) {
                    var static_value = static_values[exp.name];
                    if (!static_value || !static_value[key]) return this;
                    val = global_objs[exp.name];
                } else if (val instanceof RegExp) {
                    if (!regexp_props[key]) return this;
                } else if (typeof val == "object") {
                    if (!HOP(val, key)) return this;
                } else if (typeof val == "function") switch (key) {
                  case "name":
                    return val.node.name ? val.node.name.name : "";
                  case "length":
                    return val.node.length();
                  default:
                    return this;
                }
                return val[key];
            }
            return this;
        });
        function eval_all(nodes, compressor, ignore_side_effects, cached, depth) {
            var values = [];
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var value = node._eval(compressor, ignore_side_effects, cached, depth);
                if (node === value) return;
                values.push(value);
            }
            return values;
        }
        def(AST_Call, function(compressor, ignore_side_effects, cached, depth) {
            var exp = this.expression;
            var fn = exp instanceof AST_SymbolRef ? exp.fixed_value() : exp;
            if (fn instanceof AST_Arrow || fn instanceof AST_Defun || fn instanceof AST_Function) {
                if (fn.evaluating) return this;
                if (fn.name && fn.name.definition().recursive_refs > 0) return this;
                if (this.is_expr_pure(compressor)) return this;
                var args = eval_all(this.args, compressor, ignore_side_effects, cached, depth);
                if (!all(fn.argnames, function(sym, index) {
                    if (sym instanceof AST_DefaultValue) {
                        if (!args) return false;
                        if (args[index] !== undefined) return false;
                        var value = sym.value._eval(compressor, ignore_side_effects, cached, depth);
                        if (value === sym.value) return false;
                        args[index] = value;
                        sym = sym.name;
                    }
                    return !(sym instanceof AST_Destructured);
                })) return this;
                if (fn.rest instanceof AST_Destructured) return this;
                if (!args && !ignore_side_effects) return this;
                var stat = fn.first_statement();
                if (!(stat instanceof AST_Return)) {
                    if (ignore_side_effects) {
                        fn.walk(scan_modified);
                        var found = false;
                        fn.evaluating = true;
                        walk_body(fn, new TreeWalker(function(node) {
                            if (found) return true;
                            if (node instanceof AST_Return) {
                                if (node.value && node.value._eval(compressor, true, cached, depth) !== undefined) {
                                    found = true;
                                }
                                return true;
                            }
                            if (node instanceof AST_Scope && node !== fn) return true;
                        }));
                        delete fn.evaluating;
                        if (!found) return;
                    }
                    return this;
                }
                var val = stat.value;
                if (!val) return;
                var cached_args = [];
                if (!args || all(fn.argnames, function(sym, i) {
                    return assign(sym, args[i]);
                }) && !(fn.rest && !assign(fn.rest, args.slice(fn.argnames.length))) || ignore_side_effects) {
                    fn.evaluating = true;
                    val = val._eval(compressor, ignore_side_effects, cached, depth);
                    delete fn.evaluating;
                }
                cached_args.forEach(function(node) {
                    delete node._eval;
                });
                return val === stat.value ? this : val;
            } else if (compressor.option("unsafe") && exp instanceof AST_PropAccess) {
                var key = exp.property;
                if (key instanceof AST_Node) {
                    key = key._eval(compressor, ignore_side_effects, cached, depth);
                    if (key === exp.property) return this;
                }
                var val;
                var e = exp.expression;
                if (is_undeclared_ref(e)) {
                    var static_fn = static_fns[e.name];
                    if (!static_fn || !static_fn[key]) return this;
                    val = global_objs[e.name];
                } else {
                    val = e._eval(compressor, ignore_side_effects, cached, depth + 1);
                    if (val == null || val === e) return this;
                    var native_fn = native_fns[val.constructor.name];
                    if (!native_fn || !native_fn[key]) return this;
                    if (val instanceof RegExp && val.global && !(e instanceof AST_RegExp)) return this;
                }
                var args = eval_all(this.args, compressor, ignore_side_effects, cached, depth);
                if (!args) return this;
                if (key == "replace" && typeof args[1] == "function") return this;
                try {
                    return val[key].apply(val, args);
                } catch (ex) {
                    AST_Node.warn("Error evaluating {code} [{file}:{line},{col}]", {
                        code: this,
                        file: this.start.file,
                        line: this.start.line,
                        col: this.start.col,
                    });
                } finally {
                    if (val instanceof RegExp) val.lastIndex = 0;
                }
            }
            return this;

            function assign(sym, arg) {
                if (sym instanceof AST_DefaultValue) sym = sym.name;
                var def = sym.definition();
                if (def.orig[def.orig.length - 1] !== sym) return false;
                var value = arg;
                def.references.forEach(function(node) {
                    node._eval = function() {
                        return value;
                    };
                    cached_args.push(node);
                });
                return true;
            }
        });
        def(AST_New, return_this);
        def(AST_Template, function(compressor, ignore_side_effects, cached, depth) {
            if (!compressor.option("templates")) return this;
            if (this.tag) {
                if (!is_raw_tag(compressor, this.tag)) return this;
                decode = function(str) {
                    return str;
                };
            }
            var exprs = eval_all(this.expressions, compressor, ignore_side_effects, cached, depth);
            if (!exprs) return this;
            var malformed = false;
            var ret = decode(this.strings[0]);
            for (var i = 0; i < exprs.length; i++) {
                ret += exprs[i] + decode(this.strings[i + 1]);
            }
            if (!malformed) return ret;
            this._eval = return_this;
            return this;

            function decode(str) {
                return str.replace(/\\(u\{[^}]*\}?|u[\s\S]{0,4}|x[\s\S]{0,2}|[0-9]+|[\s\S])/g, function(match, seq) {
                    var s = decode_escape_sequence(seq);
                    if (typeof s != "string") malformed = true;
                    return s;
                });
            }
        });
    })(function(node, func) {
        node.DEFMETHOD("_eval", func);
    });

    // method to negate an expression
    (function(def) {
        function basic_negation(exp) {
            return make_node(AST_UnaryPrefix, exp, {
                operator: "!",
                expression: exp
            });
        }
        function best(orig, alt, first_in_statement) {
            var negated = basic_negation(orig);
            if (first_in_statement) {
                var stat = make_node(AST_SimpleStatement, alt, {
                    body: alt
                });
                return best_of_expression(negated, stat) === stat ? alt : negated;
            }
            return best_of_expression(negated, alt);
        }
        def(AST_Node, function() {
            return basic_negation(this);
        });
        def(AST_Statement, function() {
            throw new Error("Cannot negate a statement");
        });
        def(AST_Binary, function(compressor, first_in_statement) {
            var self = this.clone(), op = this.operator;
            if (compressor.option("unsafe_comps")) {
                switch (op) {
                  case "<=" : self.operator = ">"  ; return self;
                  case "<"  : self.operator = ">=" ; return self;
                  case ">=" : self.operator = "<"  ; return self;
                  case ">"  : self.operator = "<=" ; return self;
                }
            }
            switch (op) {
              case "==" : self.operator = "!="; return self;
              case "!=" : self.operator = "=="; return self;
              case "===": self.operator = "!=="; return self;
              case "!==": self.operator = "==="; return self;
              case "&&":
                self.operator = "||";
                self.left = self.left.negate(compressor, first_in_statement);
                self.right = self.right.negate(compressor);
                return best(this, self, first_in_statement);
              case "||":
                self.operator = "&&";
                self.left = self.left.negate(compressor, first_in_statement);
                self.right = self.right.negate(compressor);
                return best(this, self, first_in_statement);
            }
            return basic_negation(this);
        });
        def(AST_ClassExpression, function() {
            return basic_negation(this);
        });
        def(AST_Conditional, function(compressor, first_in_statement) {
            var self = this.clone();
            self.consequent = self.consequent.negate(compressor);
            self.alternative = self.alternative.negate(compressor);
            return best(this, self, first_in_statement);
        });
        def(AST_LambdaExpression, function() {
            return basic_negation(this);
        });
        def(AST_Sequence, function(compressor) {
            var expressions = this.expressions.slice();
            expressions.push(expressions.pop().negate(compressor));
            return make_sequence(this, expressions);
        });
        def(AST_UnaryPrefix, function() {
            if (this.operator == "!")
                return this.expression;
            return basic_negation(this);
        });
    })(function(node, func) {
        node.DEFMETHOD("negate", function(compressor, first_in_statement) {
            return func.call(this, compressor, first_in_statement);
        });
    });

    var global_pure_fns = makePredicate("Boolean decodeURI decodeURIComponent Date encodeURI encodeURIComponent Error escape EvalError isFinite isNaN Number Object parseFloat parseInt RangeError ReferenceError String SyntaxError TypeError unescape URIError");
    var global_pure_constructors = makePredicate("Map Set WeakMap WeakSet");
    AST_Call.DEFMETHOD("is_expr_pure", function(compressor) {
        if (compressor.option("unsafe")) {
            var expr = this.expression;
            if (is_undeclared_ref(expr)) {
                if (global_pure_fns[expr.name]) return true;
                if (this instanceof AST_New && global_pure_constructors[expr.name]) return true;
            }
            if (is_static_fn(expr)) return true;
        }
        return compressor.option("annotations") && this.pure || !compressor.pure_funcs(this);
    });
    AST_Template.DEFMETHOD("is_expr_pure", function(compressor) {
        var tag = this.tag;
        if (!tag) return true;
        if (compressor.option("unsafe")) {
            if (is_undeclared_ref(tag) && global_pure_fns[tag.name]) return true;
            if (tag instanceof AST_Dot && is_undeclared_ref(tag.expression)) {
                var static_fn = static_fns[tag.expression.name];
                return static_fn && (static_fn[tag.property]
                    || tag.expression.name == "Math" && tag.property == "random");
            }
        }
        return !compressor.pure_funcs(this);
    });
    AST_Node.DEFMETHOD("is_call_pure", return_false);
    AST_Call.DEFMETHOD("is_call_pure", function(compressor) {
        if (!compressor.option("unsafe")) return false;
        var dot = this.expression;
        if (!(dot instanceof AST_Dot)) return false;
        var exp = dot.expression;
        var map;
        var prop = dot.property;
        if (exp instanceof AST_Array) {
            map = native_fns.Array;
        } else if (exp.is_boolean(compressor)) {
            map = native_fns.Boolean;
        } else if (exp.is_number(compressor)) {
            map = native_fns.Number;
        } else if (exp instanceof AST_RegExp) {
            map = native_fns.RegExp;
        } else if (exp.is_string(compressor)) {
            map = native_fns.String;
            if (prop == "replace") {
                var arg = this.args[1];
                if (arg && !arg.is_string(compressor)) return false;
            }
        } else if (!dot.may_throw_on_access(compressor)) {
            map = native_fns.Object;
        }
        return map && map[prop];
    });

    function spread_side_effects(exp) {
        while ((exp = exp.tail_node()) instanceof AST_SymbolRef) {
            exp = exp.fixed_value();
            if (!exp) return true;
        }
        return !(exp instanceof AST_Array
            || exp.TYPE == "Binary" && !lazy_op[exp.operator]
            || exp instanceof AST_Constant
            || exp instanceof AST_Lambda
            || exp instanceof AST_Object && all(exp.properties, function(prop) {
                return !(prop instanceof AST_ObjectGetter || prop instanceof AST_Spread);
            })
            || exp instanceof AST_ObjectIdentity
            || exp instanceof AST_Unary);
    }

    // determine if expression has side effects
    (function(def) {
        function any(list, compressor, spread) {
            return !all(list, spread ? function(node) {
                return node instanceof AST_Spread ? !spread(node, compressor) : !node.has_side_effects(compressor);
            } : function(node) {
                return !node.has_side_effects(compressor);
            });
        }
        function array_spread(node, compressor) {
            return !node.expression.is_string(compressor) || node.expression.has_side_effects(compressor);
        }
        def(AST_Node, return_true);
        def(AST_Array, function(compressor) {
            return any(this.elements, compressor, array_spread);
        });
        def(AST_Assign, function(compressor) {
            var lhs = this.left;
            if (!(lhs instanceof AST_PropAccess)) return true;
            var node = lhs.expression;
            return !(node instanceof AST_ObjectIdentity)
                || !node.scope.resolve().new
                || lhs instanceof AST_Sub && lhs.property.has_side_effects(compressor)
                || this.right.has_side_effects(compressor);
        });
        def(AST_Binary, function(compressor) {
            return this.left.has_side_effects(compressor)
                || this.right.has_side_effects(compressor)
                || this.operator == "in" && !is_object(this.right);
        });
        def(AST_Block, function(compressor) {
            return any(this.body, compressor);
        });
        def(AST_Call, function(compressor) {
            if (!this.is_expr_pure(compressor)
                && (!this.is_call_pure(compressor) || this.expression.has_side_effects(compressor))) {
                return true;
            }
            return any(this.args, compressor, array_spread);
        });
        def(AST_Case, function(compressor) {
            return this.expression.has_side_effects(compressor)
                || any(this.body, compressor);
        });
        def(AST_Class, function(compressor) {
            var base = this.extends;
            if (base) {
                if (base instanceof AST_SymbolRef) base = base.fixed_value();
                if (!safe_for_extends(base)) return true;
            }
            return any(this.properties, compressor);
        });
        def(AST_ClassProperty, function(compressor) {
            return this.key instanceof AST_Node && this.key.has_side_effects(compressor)
                || this.static && this.value && this.value.has_side_effects(compressor);
        });
        def(AST_Conditional, function(compressor) {
            return this.condition.has_side_effects(compressor)
                || this.consequent.has_side_effects(compressor)
                || this.alternative.has_side_effects(compressor);
        });
        def(AST_Constant, return_false);
        def(AST_Definitions, function(compressor) {
            return any(this.definitions, compressor);
        });
        def(AST_DestructuredArray, function(compressor) {
            return any(this.elements, compressor);
        });
        def(AST_DestructuredKeyVal, function(compressor) {
            return this.key instanceof AST_Node && this.key.has_side_effects(compressor)
                || this.value.has_side_effects(compressor);
        });
        def(AST_DestructuredObject, function(compressor) {
            return any(this.properties, compressor);
        });
        def(AST_Dot, function(compressor) {
            return !this.optional && this.expression.may_throw_on_access(compressor)
                || this.expression.has_side_effects(compressor);
        });
        def(AST_EmptyStatement, return_false);
        def(AST_If, function(compressor) {
            return this.condition.has_side_effects(compressor)
                || this.body && this.body.has_side_effects(compressor)
                || this.alternative && this.alternative.has_side_effects(compressor);
        });
        def(AST_LabeledStatement, function(compressor) {
            return this.body.has_side_effects(compressor);
        });
        def(AST_Lambda, return_false);
        def(AST_Object, function(compressor) {
            return any(this.properties, compressor, function(node, compressor) {
                var exp = node.expression;
                return spread_side_effects(exp) || exp.has_side_effects(compressor);
            });
        });
        def(AST_ObjectIdentity, return_false);
        def(AST_ObjectProperty, function(compressor) {
            return this.key instanceof AST_Node && this.key.has_side_effects(compressor)
                || this.value.has_side_effects(compressor);
        });
        def(AST_Sequence, function(compressor) {
            return any(this.expressions, compressor);
        });
        def(AST_SimpleStatement, function(compressor) {
            return this.body.has_side_effects(compressor);
        });
        def(AST_Sub, function(compressor) {
            return !this.optional && this.expression.may_throw_on_access(compressor)
                || this.expression.has_side_effects(compressor)
                || this.property.has_side_effects(compressor);
        });
        def(AST_Switch, function(compressor) {
            return this.expression.has_side_effects(compressor)
                || any(this.body, compressor);
        });
        def(AST_SymbolDeclaration, return_false);
        def(AST_SymbolRef, function(compressor) {
            return !this.is_declared(compressor) || !can_drop_symbol(this, compressor);
        });
        def(AST_Template, function(compressor) {
            return !this.is_expr_pure(compressor) || any(this.expressions, compressor);
        });
        def(AST_Try, function(compressor) {
            return any(this.body, compressor)
                || this.bcatch && this.bcatch.has_side_effects(compressor)
                || this.bfinally && this.bfinally.has_side_effects(compressor);
        });
        def(AST_Unary, function(compressor) {
            return unary_side_effects[this.operator]
                || this.expression.has_side_effects(compressor);
        });
        def(AST_VarDef, function() {
            return this.value;
        });
    })(function(node, func) {
        node.DEFMETHOD("has_side_effects", func);
    });

    // determine if expression may throw
    (function(def) {
        def(AST_Node, return_true);

        def(AST_Constant, return_false);
        def(AST_Destructured, return_true);
        def(AST_EmptyStatement, return_false);
        def(AST_Lambda, return_false);
        def(AST_ObjectIdentity, return_false);
        def(AST_SymbolDeclaration, return_false);

        function any(list, compressor) {
            for (var i = list.length; --i >= 0;)
                if (list[i].may_throw(compressor))
                    return true;
            return false;
        }

        function call_may_throw(exp, compressor) {
            if (exp.may_throw(compressor)) return true;
            if (exp instanceof AST_SymbolRef) exp = exp.fixed_value();
            if (!(exp instanceof AST_Lambda)) return true;
            if (any(exp.argnames, compressor)) return true;
            if (any(exp.body, compressor)) return true;
            return is_arrow(exp) && exp.value && exp.value.may_throw(compressor);
        }

        def(AST_Array, function(compressor) {
            return any(this.elements, compressor);
        });
        def(AST_Assign, function(compressor) {
            if (this.right.may_throw(compressor)) return true;
            if (!compressor.has_directive("use strict")
                && this.operator == "="
                && this.left instanceof AST_SymbolRef) {
                return false;
            }
            return this.left.may_throw(compressor);
        });
        def(AST_Binary, function(compressor) {
            return this.left.may_throw(compressor)
                || this.right.may_throw(compressor)
                || this.operator == "in" && !is_object(this.right);
        });
        def(AST_Block, function(compressor) {
            return any(this.body, compressor);
        });
        def(AST_Call, function(compressor) {
            if (any(this.args, compressor)) return true;
            if (this.is_expr_pure(compressor)) return false;
            this.may_throw = return_true;
            var ret = call_may_throw(this.expression, compressor);
            delete this.may_throw;
            return ret;
        });
        def(AST_Case, function(compressor) {
            return this.expression.may_throw(compressor)
                || any(this.body, compressor);
        });
        def(AST_Conditional, function(compressor) {
            return this.condition.may_throw(compressor)
                || this.consequent.may_throw(compressor)
                || this.alternative.may_throw(compressor);
        });
        def(AST_DefaultValue, function(compressor) {
            return this.name.may_throw(compressor)
                || this.value && this.value.may_throw(compressor);
        });
        def(AST_Definitions, function(compressor) {
            return any(this.definitions, compressor);
        });
        def(AST_Dot, function(compressor) {
            return !this.optional && this.expression.may_throw_on_access(compressor)
                || this.expression.may_throw(compressor);
        });
        def(AST_If, function(compressor) {
            return this.condition.may_throw(compressor)
                || this.body && this.body.may_throw(compressor)
                || this.alternative && this.alternative.may_throw(compressor);
        });
        def(AST_LabeledStatement, function(compressor) {
            return this.body.may_throw(compressor);
        });
        def(AST_Object, function(compressor) {
            return any(this.properties, compressor);
        });
        def(AST_ObjectProperty, function(compressor) {
            return this.value.may_throw(compressor)
                || this.key instanceof AST_Node && this.key.may_throw(compressor);
        });
        def(AST_Return, function(compressor) {
            return this.value && this.value.may_throw(compressor);
        });
        def(AST_Sequence, function(compressor) {
            return any(this.expressions, compressor);
        });
        def(AST_SimpleStatement, function(compressor) {
            return this.body.may_throw(compressor);
        });
        def(AST_Sub, function(compressor) {
            return !this.optional && this.expression.may_throw_on_access(compressor)
                || this.expression.may_throw(compressor)
                || this.property.may_throw(compressor);
        });
        def(AST_Switch, function(compressor) {
            return this.expression.may_throw(compressor)
                || any(this.body, compressor);
        });
        def(AST_SymbolRef, function(compressor) {
            return !this.is_declared(compressor) || !can_drop_symbol(this, compressor);
        });
        def(AST_Template, function(compressor) {
            if (any(this.expressions, compressor)) return true;
            if (this.is_expr_pure(compressor)) return false;
            if (!this.tag) return false;
            this.may_throw = return_true;
            var ret = call_may_throw(this.tag, compressor);
            delete this.may_throw;
            return ret;
        });
        def(AST_Try, function(compressor) {
            return (this.bcatch ? this.bcatch.may_throw(compressor) : any(this.body, compressor))
                || this.bfinally && this.bfinally.may_throw(compressor);
        });
        def(AST_Unary, function(compressor) {
            return this.expression.may_throw(compressor)
                && !(this.operator == "typeof" && this.expression instanceof AST_SymbolRef);
        });
        def(AST_VarDef, function(compressor) {
            return this.name.may_throw(compressor)
                || this.value && this.value.may_throw(compressor);
        });
    })(function(node, func) {
        node.DEFMETHOD("may_throw", func);
    });

    // determine if expression is constant
    (function(def) {
        function all_constant(list, scope) {
            for (var i = list.length; --i >= 0;)
                if (!list[i].is_constant_expression(scope))
                    return false;
            return true;
        }
        def(AST_Node, return_false);
        def(AST_Array, function(scope) {
            return all_constant(this.elements, scope);
        });
        def(AST_Binary, function(scope) {
            return this.left.is_constant_expression(scope)
                && this.right.is_constant_expression(scope)
                && (this.operator != "in" || is_object(this.right));
        });
        def(AST_Class, function(scope) {
            var base = this.extends;
            if (base && !safe_for_extends(base)) return false;
            return all_constant(this.properties, scope);
        });
        def(AST_ClassProperty, function(scope) {
            return typeof this.key == "string" && (!this.value || this.value.is_constant_expression(scope));
        });
        def(AST_Constant, return_true);
        def(AST_Lambda, function(scope) {
            var self = this;
            var result = true;
            var scopes = [];
            self.walk(new TreeWalker(function(node, descend) {
                if (!result) return true;
                if (node instanceof AST_BlockScope) {
                    if (node === self) return;
                    scopes.push(node);
                    descend();
                    scopes.pop();
                    return true;
                }
                if (node instanceof AST_SymbolRef) {
                    if (self.inlined || node.redef) {
                        result = false;
                        return true;
                    }
                    if (self.variables.has(node.name)) return true;
                    var def = node.definition();
                    if (member(def.scope, scopes)) return true;
                    if (scope && !def.redefined()) {
                        var scope_def = scope.find_variable(node.name);
                        if (scope_def ? scope_def === def : def.undeclared) {
                            result = "f";
                            return true;
                        }
                    }
                    result = false;
                    return true;
                }
                if (node instanceof AST_ObjectIdentity) {
                    if (is_arrow(self) && all(scopes, function(s) {
                        return !(s instanceof AST_Scope) || is_arrow(s);
                    })) result = false;
                    return true;
                }
            }));
            return result;
        });
        def(AST_Object, function(scope) {
            return all_constant(this.properties, scope);
        });
        def(AST_ObjectProperty, function(scope) {
            return typeof this.key == "string" && this.value.is_constant_expression(scope);
        });
        def(AST_Unary, function(scope) {
            return this.expression.is_constant_expression(scope);
        });
    })(function(node, func) {
        node.DEFMETHOD("is_constant_expression", func);
    });

    // tell me if a statement aborts
    function aborts(thing) {
        return thing && thing.aborts();
    }
    (function(def) {
        def(AST_Statement, return_null);
        def(AST_Jump, return_this);
        function block_aborts() {
            var n = this.body.length;
            return n > 0 && aborts(this.body[n - 1]);
        }
        def(AST_BlockStatement, block_aborts);
        def(AST_SwitchBranch, block_aborts);
        def(AST_If, function() {
            return this.alternative && aborts(this.body) && aborts(this.alternative) && this;
        });
    })(function(node, func) {
        node.DEFMETHOD("aborts", func);
    });

    /* -----[ optimizers ]----- */

    var directives = makePredicate(["use asm", "use strict"]);
    OPT(AST_Directive, function(self, compressor) {
        if (compressor.option("directives")
            && (!directives[self.value] || compressor.has_directive(self.value) !== self)) {
            return make_node(AST_EmptyStatement, self);
        }
        return self;
    });

    OPT(AST_Debugger, function(self, compressor) {
        if (compressor.option("drop_debugger"))
            return make_node(AST_EmptyStatement, self);
        return self;
    });

    OPT(AST_LabeledStatement, function(self, compressor) {
        if (compressor.option("dead_code")
            && self.body instanceof AST_Break
            && compressor.loopcontrol_target(self.body) === self.body) {
            return make_node(AST_EmptyStatement, self);
        }
        return compressor.option("unused") && self.label.references.length == 0 ? self.body : self;
    });

    OPT(AST_Block, function(self, compressor) {
        self.body = tighten_body(self.body, compressor);
        return self;
    });

    function trim_block(node, parent, in_list) {
        switch (node.body.length) {
          case 0:
            return in_list ? List.skip : make_node(AST_EmptyStatement, node);
          case 1:
            var stat = node.body[0];
            if (!safe_to_trim(stat)) return node;
            if (parent instanceof AST_IterationStatement && stat instanceof AST_LambdaDefinition) return node;
            return stat;
        }
        return node;
    }

    OPT(AST_BlockStatement, function(self, compressor) {
        self.body = tighten_body(self.body, compressor);
        return trim_block(self, compressor.parent());
    });

    function drop_rest_farg(fn, compressor) {
        if (!compressor.option("rests")) return;
        if (fn.uses_arguments) return;
        if (!(fn.rest instanceof AST_DestructuredArray)) return;
        if (!compressor.drop_fargs(fn, compressor.parent())) return;
        fn.argnames = fn.argnames.concat(fn.rest.elements);
        fn.rest = fn.rest.rest;
    }

    OPT(AST_Lambda, function(self, compressor) {
        drop_rest_farg(self, compressor);
        self.body = tighten_body(self.body, compressor);
        return self;
    });

    function opt_arrow(self, compressor) {
        if (!compressor.option("arrows")) return self;
        drop_rest_farg(self, compressor);
        var body = tighten_body(self.value ? [ self.first_statement() ] : self.body, compressor);
        switch (body.length) {
          case 1:
            var stat = body[0];
            if (stat instanceof AST_Return) {
                self.body.length = 0;
                self.value = stat.value;
                break;
            }
          default:
            self.body = body;
            self.value = null;
            break;
        }
        return self;
    }
    OPT(AST_Arrow, opt_arrow);
    OPT(AST_AsyncArrow, opt_arrow);

    OPT(AST_Function, function(self, compressor) {
        drop_rest_farg(self, compressor);
        self.body = tighten_body(self.body, compressor);
        var parent = compressor.parent();
        if (compressor.option("inline")) for (var i = 0; i < self.body.length; i++) {
            var stat = self.body[i];
            if (stat instanceof AST_Directive) continue;
            if (stat instanceof AST_Return) {
                if (i != self.body.length - 1) break;
                var call = stat.value;
                if (!call || call.TYPE != "Call") break;
                if (call.is_expr_pure(compressor)) break;
                var fn = call.expression;
                if (fn instanceof AST_SymbolRef) {
                    if (self.name && self.name.definition() === fn.definition()) break;
                    fn = fn.fixed_value();
                }
                if (!(fn instanceof AST_Defun || fn instanceof AST_Function)) break;
                if (fn.uses_arguments) break;
                if (fn === call.expression) {
                    if (fn.parent_scope !== self) break;
                    if (!all(fn.enclosed, function(def) {
                        return def.scope !== self;
                    })) break;
                }
                if (fn.name
                    && (parent instanceof AST_ClassMethod || parent instanceof AST_ObjectMethod)
                    && parent.value === compressor.self()) break;
                if (fn.contains_this()) break;
                var len = fn.argnames.length;
                if (len > 0 && compressor.option("inline") < 2) break;
                if (len > self.argnames.length) break;
                if (!all(self.argnames, function(argname) {
                    return argname instanceof AST_SymbolFunarg;
                })) break;
                if (!all(call.args, function(arg) {
                    return !(arg instanceof AST_Spread);
                })) break;
                for (var j = 0; j < len; j++) {
                    var arg = call.args[j];
                    if (!(arg instanceof AST_SymbolRef)) break;
                    if (arg.definition() !== self.argnames[j].definition()) break;
                }
                if (j < len) break;
                for (; j < call.args.length; j++) {
                    if (call.args[j].has_side_effects(compressor)) break;
                }
                if (j < call.args.length) break;
                if (len < self.argnames.length && !compressor.drop_fargs(self, parent)) {
                    if (!compressor.drop_fargs(fn, call)) break;
                    do {
                        fn.argnames.push(fn.make_var(AST_SymbolFunarg, fn, "argument_" + len));
                    } while (++len < self.argnames.length);
                }
                return call.expression;
            }
            break;
        }
        return self;
    });

    var NO_MERGE = makePredicate("arguments await yield");
    AST_Scope.DEFMETHOD("merge_variables", function(compressor) {
        if (!compressor.option("merge_vars")) return;
        var in_try, root, segment = {}, self = this;
        var first = [], last = [], index = 0;
        var declarations = new Dictionary();
        var references = Object.create(null);
        var prev = Object.create(null);
        var tw = new TreeWalker(function(node, descend) {
            if (node instanceof AST_Assign) {
                var lhs = node.left;
                var rhs = node.right;
                if (lhs instanceof AST_Destructured) {
                    rhs.walk(tw);
                    var marker = new TreeWalker(function(node) {
                        if (node instanceof AST_Destructured) return;
                        if (node instanceof AST_DefaultValue) {
                            push();
                            node.value.walk(tw);
                            pop();
                            node.name.walk(marker);
                        } else if (node instanceof AST_DestructuredKeyVal) {
                            if (node.key instanceof AST_Node) {
                                push();
                                segment.block = node;
                                node.key.walk(tw);
                                node.value.walk(marker);
                                pop();
                            } else {
                                node.value.walk(marker);
                            }
                        } else if (node instanceof AST_SymbolRef) {
                            mark(node);
                        } else {
                            node.walk(tw);
                        }
                        return true;
                    });
                    lhs.walk(marker);
                    return true;
                }
                if (lazy_op[node.operator.slice(0, -1)]) {
                    lhs.walk(tw);
                    push();
                    rhs.walk(tw);
                    if (lhs instanceof AST_SymbolRef) mark(lhs);
                    pop();
                    return true;
                }
                if (lhs instanceof AST_SymbolRef) {
                    if (node.operator != "=") mark(lhs, true);
                    rhs.walk(tw);
                    mark(lhs);
                    return true;
                }
                return;
            }
            if (node instanceof AST_Binary) {
                if (!lazy_op[node.operator]) return;
                node.left.walk(tw);
                push();
                node.right.walk(tw);
                pop();
                return true;
            }
            if (node instanceof AST_Break) {
                var target = tw.loopcontrol_target(node);
                if (!(target instanceof AST_IterationStatement)) insert(target);
                return true;
            }
            if (node instanceof AST_Call) {
                var exp = node.expression;
                var tail = exp.tail_node();
                if (!(tail instanceof AST_LambdaExpression)) {
                    descend();
                    return mark_expression(exp);
                }
                if (exp !== tail) exp.expressions.slice(0, -1).forEach(function(node) {
                    node.walk(tw);
                });
                node.args.forEach(function(arg) {
                    arg.walk(tw);
                });
                tail.walk(tw);
                return true;
            }
            if (node instanceof AST_Conditional) {
                node.condition.walk(tw);
                push();
                node.consequent.walk(tw);
                pop();
                push();
                node.alternative.walk(tw);
                pop();
                return true;
            }
            if (node instanceof AST_Continue) {
                var target = tw.loopcontrol_target(node);
                if (target instanceof AST_Do) insert(target);
                return true;
            }
            if (node instanceof AST_Do) {
                push();
                segment.block = node;
                segment.loop = true;
                var save = segment;
                node.body.walk(tw);
                if (segment.inserted === node) segment = save;
                node.condition.walk(tw);
                pop();
                return true;
            }
            if (node instanceof AST_For) {
                if (node.init) node.init.walk(tw);
                push();
                segment.block = node;
                segment.loop = true;
                if (node.condition) node.condition.walk(tw);
                node.body.walk(tw);
                if (node.step) node.step.walk(tw);
                pop();
                return true;
            }
            if (node instanceof AST_ForEnumeration) {
                node.object.walk(tw);
                push();
                segment.block = node;
                segment.loop = true;
                node.init.walk(tw);
                node.body.walk(tw);
                pop();
                return true;
            }
            if (node instanceof AST_If) {
                node.condition.walk(tw);
                push();
                node.body.walk(tw);
                pop();
                if (node.alternative) {
                    push();
                    node.alternative.walk(tw);
                    pop();
                }
                return true;
            }
            if (node instanceof AST_LabeledStatement) {
                push();
                segment.block = node;
                var save = segment;
                node.body.walk(tw);
                if (segment.inserted === node) segment = save;
                pop();
                return true;
            }
            if (node instanceof AST_Scope) {
                push();
                segment.block = node;
                if (node === self) root = segment;
                if (node instanceof AST_Lambda) {
                    if (node.name) references[node.name.definition().id] = false;
                    var marker = node.uses_arguments && !tw.has_directive("use strict") ? function(node) {
                        if (node instanceof AST_SymbolFunarg) references[node.definition().id] = false;
                    } : function(node) {
                        if (node instanceof AST_SymbolFunarg) mark(node);
                    };
                    var scanner = new TreeWalker(function(ref) {
                        if (ref instanceof AST_SymbolDeclaration) references[ref.definition().id] = false;
                        if (!(ref instanceof AST_SymbolRef)) return;
                        var def = ref.definition();
                        var ldef = node.variables.get(ref.name);
                        if (ldef && (ldef === def
                            || def.undeclared
                            || node.parent_scope.find_variable(ref.name) === def)) {
                            references[def.id] = false;
                            references[ldef.id] = false;
                        } else {
                            var save = segment;
                            pop();
                            mark(ref, true);
                            segment = save;
                        }
                        return true;
                    });
                    node.argnames.forEach(function(argname) {
                        argname.mark_symbol(marker, scanner);
                    });
                    if (node.rest) node.rest.mark_symbol(marker, scanner);
                }
                walk_lambda(node, tw);
                pop();
                return true;
            }
            if (node instanceof AST_Sub) {
                var exp = node.expression;
                if (node.optional) {
                    exp.walk(tw);
                    push();
                    node.property.walk(tw);
                    pop();
                } else {
                    descend();
                }
                return mark_expression(exp);
            }
            if (node instanceof AST_Switch) {
                node.expression.walk(tw);
                var save = segment;
                node.body.forEach(function(branch) {
                    if (branch instanceof AST_Default) return;
                    branch.expression.walk(tw);
                    if (save === segment) push();
                });
                segment = save;
                node.body.forEach(function(branch) {
                    push();
                    segment.block = node;
                    var save = segment;
                    walk_body(branch, tw);
                    if (segment.inserted === node) segment = save;
                    pop();
                });
                return true;
            }
            if (node instanceof AST_SymbolConst || node instanceof AST_SymbolLet) {
                references[node.definition().id] = false;
                return true;
            }
            if (node instanceof AST_SymbolRef) {
                mark(node, true);
                return true;
            }
            if (node instanceof AST_Try) {
                var save_try = in_try;
                in_try = node;
                var save = segment;
                walk_body(node, tw);
                segment = save;
                if (node.bcatch) {
                    if (node.bcatch.argname) node.bcatch.argname.mark_symbol(function(node) {
                        if (node instanceof AST_SymbolCatch) {
                            var def = node.definition();
                            references[def.id] = false;
                            if (def = def.redefined()) references[def.id] = false;
                        }
                    }, tw);
                    if (node.bfinally || (in_try = save_try)) {
                        walk_body(node.bcatch, tw);
                    } else {
                        push();
                        walk_body(node.bcatch, tw);
                        pop();
                    }
                }
                in_try = save_try;
                segment = save;
                if (node.bfinally) node.bfinally.walk(tw);
                return true;
            }
            if (node instanceof AST_Unary) {
                if (!UNARY_POSTFIX[node.operator]) return;
                var sym = node.expression;
                if (!(sym instanceof AST_SymbolRef)) return;
                mark(sym, true);
                return true;
            }
            if (node instanceof AST_VarDef) {
                var assigned = node.value;
                if (assigned) {
                    assigned.walk(tw);
                } else {
                    assigned = segment.block instanceof AST_ForEnumeration && segment.block.init === tw.parent();
                }
                node.name.mark_symbol(assigned ? function(node) {
                    if (!(node instanceof AST_SymbolDeclaration)) return;
                    if (node instanceof AST_SymbolVar) {
                        mark(node);
                    } else {
                        references[node.definition().id] = false;
                    }
                    return true;
                } : function(node) {
                    if (!(node instanceof AST_SymbolDeclaration)) return;
                    var id = node.definition().id;
                    if (!(node instanceof AST_SymbolVar)) {
                        references[id] = false;
                    } else if (!(id in references)) {
                        declarations.add(id, node);
                    } else if (references[id]) {
                        references[id].push(node);
                    }
                    return true;
                }, tw);
                return true;
            }
            if (node instanceof AST_While) {
                push();
                segment.block = node;
                segment.loop = true;
                descend();
                pop();
                return true;
            }

            function mark_expression(exp) {
                if (compressor.option("ie")) {
                    var sym = root_expr(exp);
                    if (sym instanceof AST_SymbolRef) sym.walk(tw);
                }
                return true;
            }
        });
        tw.directives = Object.create(compressor.directives);
        self.walk(tw);
        var merged = Object.create(null);
        while (first.length && last.length) {
            var head = first.pop();
            var def = head.definition;
            if (!(def.id in prev)) continue;
            if (!references[def.id]) continue;
            var head_refs = {
                start: references[def.id].start,
            };
            while (def.id in merged) def = merged[def.id];
            head_refs.end = references[def.id].end;
            var skipped = [];
            do {
                var tail = last.pop();
                if (!tail) continue;
                if (tail.index > head.index) continue;
                var id = tail.definition.id;
                var tail_refs = references[id];
                if (!tail_refs) continue;
                if (head_refs.start.block !== tail_refs.start.block
                    || !mergeable(head_refs, tail_refs)
                    || (head_refs.start.loop || !same_scope(def)) && !mergeable(tail_refs, head_refs)
                    || compressor.option("webkit") && is_funarg(def) !== is_funarg(tail.definition)
                    || !all(tail_refs, function(sym) {
                        return sym.scope.find_variable(def.name) === def;
                    })) {
                    skipped.unshift(tail);
                    continue;
                }
                var orig = [], refs = [];
                tail_refs.forEach(function(sym) {
                    sym.thedef = def;
                    sym.name = def.name;
                    if (sym instanceof AST_SymbolRef) {
                        refs.push(sym);
                    } else {
                        orig.push(sym);
                    }
                });
                def.orig = orig.concat(def.orig);
                def.references = refs.concat(def.references);
                def.fixed = tail.definition.fixed && def.fixed;
                merged[id] = def;
                break;
            } while (last.length);
            if (skipped.length) last = last.concat(skipped);
        }

        function push() {
            segment = Object.create(segment);
        }

        function pop() {
            segment = Object.getPrototypeOf(segment);
        }

        function mark(sym, read) {
            var def = sym.definition(), ldef, seg = segment;
            if (in_try) {
                push();
                seg = segment;
                pop();
            }
            if (def.id in references) {
                var refs = references[def.id];
                if (!refs) return;
                if (refs.start.block !== seg.block) return references[def.id] = false;
                refs.push(sym);
                refs.end = seg;
                if (def.id in prev) {
                    last[prev[def.id]] = null;
                } else if (!read) {
                    return;
                }
            } else if ((ldef = self.variables.get(def.name)) !== def) {
                if (ldef && root === seg) references[ldef.id] = false;
                return references[def.id] = false;
            } else if (compressor.exposed(def) || NO_MERGE[sym.name]) {
                return references[def.id] = false;
            } else {
                var refs = declarations.get(def.id) || [];
                refs.push(sym);
                references[def.id] = refs;
                if (!read) {
                    refs.start = seg;
                    return first.push({
                        index: index++,
                        definition: def,
                    });
                }
                if (seg.block !== self) return references[def.id] = false;
                refs.start = root;
            }
            prev[def.id] = last.length;
            last.push({
                index: index++,
                definition: def,
            });
        }

        function insert(target) {
            var stack = [];
            while (true) {
                if (HOP(segment, "block")) {
                    var block = segment.block;
                    if (block instanceof AST_LabeledStatement) block = block.body;
                    if (block === target) break;
                }
                stack.push(segment);
                pop();
            }
            segment.inserted = segment.block;
            push();
            while (stack.length) {
                var seg = stack.pop();
                push();
                if (HOP(seg, "block")) segment.block = seg.block;
                if (HOP(seg, "loop")) segment.loop = seg.loop;
            }
        }

        function must_visit(base, segment) {
            return base === segment || base.isPrototypeOf(segment);
        }

        function mergeable(head, tail) {
            return must_visit(head.start, head.end) || must_visit(head.start, tail.start);
        }
    });

    function fill_holes(orig, elements) {
        for (var i = elements.length; --i >= 0;) {
            if (!elements[i]) elements[i] = make_node(AST_Hole, orig);
        }
    }

    function to_class_expr(defcl, drop_name) {
        var cl = make_node(AST_ClassExpression, defcl, defcl);
        cl.name = drop_name ? null : make_node(AST_SymbolClass, defcl.name, defcl.name);
        return cl;
    }

    function to_func_expr(defun, drop_name) {
        var ctor;
        switch (defun.CTOR) {
          case AST_AsyncDefun:
            ctor = AST_AsyncFunction;
            break;
          case AST_AsyncGeneratorDefun:
            ctor = AST_AsyncGeneratorFunction;
            break;
          case AST_Defun:
            ctor = AST_Function;
            break;
          case AST_GeneratorDefun:
            ctor = AST_GeneratorFunction;
            break;
        }
        var fn = make_node(ctor, defun, defun);
        fn.name = drop_name ? null : make_node(AST_SymbolLambda, defun.name, defun.name);
        return fn;
    }

    AST_Scope.DEFMETHOD("drop_unused", function(compressor) {
        if (!compressor.option("unused")) return;
        var self = this;
        var drop_funcs = !(self instanceof AST_Toplevel) || compressor.toplevel.funcs;
        var drop_vars = !(self instanceof AST_Toplevel) || compressor.toplevel.vars;
        var assign_as_unused = /keep_assign/.test(compressor.option("unused")) ? return_false : function(node, props) {
            var sym, nested = false;
            if (node instanceof AST_Assign) {
                if (node.write_only || node.operator == "=") sym = extract_reference(node.left, props);
            } else if (node instanceof AST_Unary) {
                if (node.write_only) sym = extract_reference(node.expression, props);
            }
            if (!(sym instanceof AST_SymbolRef)) return;
            var def = sym.definition();
            if (export_defaults[def.id]) return;
            if (compressor.exposed(def)) return;
            if (!can_drop_symbol(sym, compressor, nested)) return;
            return sym;

            function extract_reference(node, props) {
                if (node instanceof AST_PropAccess) {
                    var expr = node.expression;
                    if (!expr.may_throw_on_access(compressor, true)) {
                        nested = true;
                        if (props && node instanceof AST_Sub) props.unshift(node.property);
                        return extract_reference(expr, props);
                    }
                } else if (node instanceof AST_Assign && node.operator == "=") {
                    node.write_only = "p";
                    var ref = extract_reference(node.right);
                    if (!props) return ref;
                    props.assign = node;
                    return ref instanceof AST_SymbolRef ? ref : node.left;
                }
                return node;
            }
        };
        var assign_in_use = Object.create(null);
        var export_defaults = Object.create(null);
        var find_variable = function(name) {
            find_variable = compose(self, 0, noop);
            return find_variable(name);

            function compose(child, level, find) {
                var parent = compressor.parent(level);
                if (!parent) return find;
                var in_arg = parent instanceof AST_Lambda && member(child, parent.argnames);
                return compose(parent, level + 1, in_arg ? function(name) {
                    var def = find(name);
                    if (def) return def;
                    def = parent.variables.get(name);
                    if (def) {
                        var sym = def.orig[0];
                        if (sym instanceof AST_SymbolFunarg || sym instanceof AST_SymbolLambda) return def;
                    }
                } : parent.variables ? function(name) {
                    return find(name) || parent.variables.get(name);
                } : find);
            }
        };
        var for_ins = Object.create(null);
        var in_use = [];
        var in_use_ids = Object.create(null); // avoid expensive linear scans of in_use
        var value_read = Object.create(null);
        var value_modified = Object.create(null);
        var var_defs = Object.create(null);
        if (self instanceof AST_Toplevel && compressor.top_retain) {
            self.variables.each(function(def) {
                if (compressor.top_retain(def) && !(def.id in in_use_ids)) {
                    in_use_ids[def.id] = true;
                    in_use.push(def);
                }
            });
        }
        var assignments = new Dictionary();
        var initializations = new Dictionary();
        // pass 1: find out which symbols are directly used in
        // this scope (not in nested scopes).
        var scope = this;
        var tw = new TreeWalker(function(node, descend) {
            if (node instanceof AST_Lambda && node.uses_arguments && !tw.has_directive("use strict")) {
                node.each_argname(function(argname) {
                    var def = argname.definition();
                    if (!(def.id in in_use_ids)) {
                        in_use_ids[def.id] = true;
                        in_use.push(def);
                    }
                });
            }
            if (node === self) return;
            if (scope === self) {
                if (node instanceof AST_DefClass) {
                    var def = node.name.definition();
                    if ((!drop_funcs || def.exported) && !(def.id in in_use_ids)) {
                        in_use_ids[def.id] = true;
                        in_use.push(def);
                    }
                    if (node.extends) node.extends.walk(tw);
                    var is_export = false;
                    if (tw.parent() instanceof AST_ExportDefault) {
                        is_export = true;
                        export_defaults[def.id] = true;
                    }
                    node.properties.forEach(function(prop) {
                        if (prop.key instanceof AST_Node) prop.key.walk(tw);
                        if (!prop.value) return;
                        if (is_export || prop instanceof AST_ClassField && prop.static) {
                            var save_scope = scope;
                            scope = node;
                            prop.value.walk(tw);
                            scope = save_scope;
                        } else {
                            initializations.add(def.id, prop.value);
                        }
                    });
                    return true;
                }
                if (node instanceof AST_LambdaDefinition) {
                    var def = node.name.definition();
                    if ((!drop_funcs || def.exported) && !(def.id in in_use_ids)) {
                        in_use_ids[def.id] = true;
                        in_use.push(def);
                    }
                    initializations.add(def.id, node);
                    if (tw.parent() instanceof AST_ExportDefault) {
                        export_defaults[def.id] = true;
                    } else {
                        return true;
                    }
                }
                if (node instanceof AST_Definitions) {
                    node.definitions.forEach(function(defn) {
                        var value = defn.value;
                        var side_effects = value
                            && (defn.name instanceof AST_Destructured || value.has_side_effects(compressor));
                        var shared = side_effects && value.tail_node().operator == "=";
                        defn.name.mark_symbol(function(name) {
                            if (!(name instanceof AST_SymbolDeclaration)) return;
                            var def = name.definition();
                            var_defs[def.id] = (var_defs[def.id] || 0) + 1;
                            if (node instanceof AST_Var && def.orig[0] instanceof AST_SymbolCatch) {
                                var redef = def.redefined();
                                if (redef) var_defs[redef.id] = (var_defs[redef.id] || 0) + 1;
                            }
                            if (!(def.id in in_use_ids) && (!drop_vars || def.exported
                                || (node instanceof AST_Const ? def.redefined() : def.const_redefs)
                                || !(node instanceof AST_Var || is_safe_lexical(def)))) {
                                in_use_ids[def.id] = true;
                                in_use.push(def);
                            }
                            if (value) {
                                if (!side_effects) {
                                    initializations.add(def.id, value);
                                } else if (shared) {
                                    verify_safe_usage(def, name, value_modified[def.id]);
                                }
                                assignments.add(def.id, defn);
                            }
                            return true;
                        }, tw);
                        if (side_effects) value.walk(tw);
                    });
                    return true;
                }
                if (node instanceof AST_SymbolFunarg) {
                    var def = node.definition();
                    var_defs[def.id] = (var_defs[def.id] || 0) + 1;
                    assignments.add(def.id, node);
                    return true;
                }
                if (node instanceof AST_SymbolImport) {
                    var def = node.definition();
                    if (!(def.id in in_use_ids) && (!drop_vars || !is_safe_lexical(def))) {
                        in_use_ids[def.id] = true;
                        in_use.push(def);
                    }
                    return true;
                }
            }
            return scan_ref_scoped(node, descend, true);
        });
        tw.directives = Object.create(compressor.directives);
        self.walk(tw);
        var drop_fn_name = compressor.option("keep_fnames") ? return_false : compressor.option("ie") ? function(def) {
            return !compressor.exposed(def) && def.references.length == def.replaced;
        } : function(def) {
            if (!(def.id in in_use_ids)) return true;
            if (def.orig.length - def.eliminated < 2) return false;
            // function argument will always overshadow its name
            if (def.orig[1] instanceof AST_SymbolFunarg) return true;
            // retain if referenced within destructured object of argument
            return all(def.references, function(ref) {
                return !ref.in_arg;
            });
        };
        if (compressor.option("ie")) initializations.each(function(init, id) {
            if (id in in_use_ids) return;
            init.forEach(function(init) {
                init.walk(new TreeWalker(function(node) {
                    if (node instanceof AST_Function && node.name && !drop_fn_name(node.name.definition())) {
                        node.walk(tw);
                        return true;
                    }
                    if (node instanceof AST_Scope) return true;
                }));
            });
        });
        // pass 2: for every used symbol we need to walk its
        // initialization code to figure out if it uses other
        // symbols (that may not be in_use).
        tw = new TreeWalker(scan_ref_scoped);
        for (var i = 0; i < in_use.length; i++) {
            var init = initializations.get(in_use[i].id);
            if (init) init.forEach(function(init) {
                init.walk(tw);
            });
        }
        Object.keys(assign_in_use).forEach(function(id) {
            var assigns = assign_in_use[id];
            if (!assigns) {
                delete assign_in_use[id];
                return;
            }
            assigns = assigns.reduce(function(in_use, assigns) {
                assigns.forEach(function(assign) {
                    push_uniq(in_use, assign);
                });
                return in_use;
            }, []);
            var in_use = (assignments.get(id) || []).filter(function(node) {
                return find_if(node instanceof AST_Unary ? function(assign) {
                    return assign === node;
                } : function(assign) {
                    if (assign === node) return true;
                    if (assign instanceof AST_Unary) return false;
                    return get_rvalue(assign) === get_rvalue(node);
                }, assigns);
            });
            if (assigns.length == in_use.length) {
                assign_in_use[id] = in_use;
            } else {
                delete assign_in_use[id];
            }
        });
        // pass 3: we should drop declarations not in_use
        var trim_defns = [];
        var unused_fn_names = [];
        var calls_to_drop_args = [];
        var fns_with_marked_args = [];
        var trimmer = new TreeTransformer(function(node) {
            if (node instanceof AST_DefaultValue) return trim_default(trimmer, node);
            if (node instanceof AST_Destructured && node.rest) node.rest = node.rest.transform(trimmer);
            if (node instanceof AST_DestructuredArray) {
                var trim = !node.rest;
                for (var i = node.elements.length; --i >= 0;) {
                    var element = node.elements[i].transform(trimmer);
                    if (element) {
                        node.elements[i] = element;
                        trim = false;
                    } else if (trim) {
                        node.elements.pop();
                    } else {
                        node.elements[i] = make_node(AST_Hole, node.elements[i]);
                    }
                }
                return node;
            }
            if (node instanceof AST_DestructuredObject) {
                var properties = [];
                node.properties.forEach(function(prop) {
                    var retain = false;
                    if (prop.key instanceof AST_Node) {
                        prop.key = prop.key.transform(tt);
                        retain = prop.key.has_side_effects(compressor);
                    }
                    if ((retain || node.rest) && is_decl(prop.value)) {
                        prop.value = prop.value.transform(tt);
                        properties.push(prop);
                    } else {
                        var value = prop.value.transform(trimmer);
                        if (!value && node.rest) {
                            if (prop.value instanceof AST_DestructuredArray) {
                                value = make_node(AST_DestructuredArray, prop.value, { elements: [] });
                            } else {
                                value = make_node(AST_DestructuredObject, prop.value, { properties: [] });
                            }
                        }
                        if (value) {
                            prop.value = value;
                            properties.push(prop);
                        }
                    }
                });
                node.properties = properties;
                return node;
            }
            if (node instanceof AST_SymbolDeclaration) return node.definition().id in in_use_ids ? node : null;
        });
        var tt = new TreeTransformer(function(node, descend, in_list) {
            var parent = tt.parent();
            if (drop_vars) {
                var props = [], sym = assign_as_unused(node, props);
                if (sym) {
                    var value;
                    if (can_drop_lhs(sym, node)) {
                        if (node instanceof AST_Assign) {
                            value = get_rhs(node);
                            if (node.write_only === true) value = value.drop_side_effect_free(compressor);
                        }
                        if (!value) value = make_node(AST_Number, node, { value: 0 });
                    }
                    if (value) {
                        if (props.assign) {
                            var assign = props.assign.drop_side_effect_free(compressor);
                            if (assign) {
                                assign.write_only = true;
                                props.unshift(assign);
                            }
                        }
                        if (!(parent instanceof AST_Sequence)
                            || parent.tail_node() === node
                            || value.has_side_effects(compressor)) {
                            props.push(value);
                        }
                        switch (props.length) {
                          case 0:
                            return List.skip;
                          case 1:
                            return maintain_this_binding(compressor, parent, node, props[0].transform(tt));
                          default:
                            return make_sequence(node, props.map(function(prop) {
                                return prop.transform(tt);
                            }));
                        }
                    }
                } else if (node instanceof AST_UnaryPostfix
                    && node.expression instanceof AST_SymbolRef
                    && indexOf_assign(node.expression.definition(), node) < 0) {
                    return make_node(AST_UnaryPrefix, node, {
                        operator: "+",
                        expression: node.expression
                    });
                }
            }
            if (node instanceof AST_Call) calls_to_drop_args.push(node);
            if (scope !== self) return;
            if (drop_funcs && node !== self && node instanceof AST_DefClass) {
                var def = node.name.definition();
                if (!(def.id in in_use_ids)) {
                    log(node.name, "Dropping unused class {name}");
                    def.eliminated++;
                    descend(node, tt);
                    if (parent instanceof AST_ExportDefault) return to_class_expr(node, true);
                    var trimmed = node.drop_side_effect_free(compressor, true);
                    if (trimmed === node) trimmed = to_class_expr(node, true);
                    if (trimmed) return make_node(AST_SimpleStatement, node, { body: trimmed });
                    return in_list ? List.skip : make_node(AST_EmptyStatement, node);
                }
            }
            if (node instanceof AST_ClassExpression && node.name && drop_fn_name(node.name.definition())) {
                unused_fn_names.push(node);
            }
            if (node instanceof AST_Lambda) {
                if (drop_funcs && node !== self && node instanceof AST_LambdaDefinition) {
                    var def = node.name.definition();
                    if (!(def.id in in_use_ids)) {
                        log(node.name, "Dropping unused function {name}");
                        def.eliminated++;
                        if (parent instanceof AST_ExportDefault) {
                            descend_scope();
                            return to_func_expr(node, true);
                        }
                        return in_list ? List.skip : make_node(AST_EmptyStatement, node);
                    }
                }
                if (node instanceof AST_LambdaExpression && node.name && drop_fn_name(node.name.definition())) {
                    unused_fn_names.push(node);
                }
                if (!(node instanceof AST_Accessor)) {
                    if (node.rest) {
                        var rest = node.rest.transform(trimmer);
                        if (rest instanceof AST_Destructured && !rest.rest
                            && (!node.uses_arguments || tt.has_directive("use strict"))) {
                            if (rest instanceof AST_DestructuredArray) {
                                if (rest.elements.length == 0) rest = null;
                            } else if (rest.properties.length == 0) {
                                rest = null;
                            }
                        }
                        node.rest = rest;
                    }
                    var argnames = node.argnames;
                    var trim = compressor.drop_fargs(node, parent) && !node.rest;
                    var default_length = trim ? -1 : node.length();
                    for (var i = argnames.length; --i >= 0;) {
                        var sym = argnames[i];
                        if (!(sym instanceof AST_SymbolFunarg)) {
                            var arg = sym.transform(trimmer);
                            if (arg) {
                                trim = false;
                            } else if (trim) {
                                log(sym.name, "Dropping unused default argument {name}");
                                argnames.pop();
                            } else if (i > default_length) {
                                log(sym.name, "Dropping unused default argument assignment {name}");
                                sym.name.__unused = true;
                                argnames[i] = sym.name;
                            } else {
                                log(sym.name, "Dropping unused default argument value {name}");
                                sym.value = make_node(AST_Number, sym, { value: 0 });
                            }
                            continue;
                        }
                        var def = sym.definition();
                        if (def.id in in_use_ids) {
                            trim = false;
                            if (indexOf_assign(def, sym) < 0) sym.__unused = null;
                        } else if (trim) {
                            log(sym, "Dropping unused function argument {name}");
                            argnames.pop();
                        } else {
                            sym.__unused = true;
                        }
                    }
                    fns_with_marked_args.push(node);
                }
            }
            if (node instanceof AST_Catch && node.argname instanceof AST_Destructured) {
                node.argname.transform(trimmer);
            }
            if (node instanceof AST_Definitions && !(parent instanceof AST_ForEnumeration && parent.init === node)) {
                // place uninitialized names at the start
                var body = [], head = [], tail = [];
                // for unused names whose initialization has
                // side effects, we can cascade the init. code
                // into the next one, or next statement.
                var side_effects = [];
                var duplicated = 0;
                var is_var = node instanceof AST_Var;
                node.definitions.forEach(function(def) {
                    if (def.value) def.value = def.value.transform(tt);
                    var value = def.value;
                    if (def.name instanceof AST_Destructured) {
                        var trimmed = trim_destructured(def.name, value, function(node) {
                            if (!drop_vars) return node;
                            if (node.definition().id in in_use_ids) return node;
                            if (is_catch(node)) return node;
                            if (is_var && !can_drop_symbol(node)) return node;
                            return null;
                        }, true);
                        if (trimmed.name) {
                            def = make_node(AST_VarDef, def, {
                                name: trimmed.name,
                                value: value = trimmed.value,
                            });
                            flush();
                        } else if (trimmed.value) {
                            side_effects.push(trimmed.value);
                        }
                        return;
                    }
                    var sym = def.name.definition();
                    var drop_sym = is_var ? can_drop_symbol(def.name) : is_safe_lexical(sym);
                    if (!drop_sym || !drop_vars || sym.id in in_use_ids) {
                        if (value && indexOf_assign(sym, def) < 0) {
                            value = value.drop_side_effect_free(compressor);
                            if (value) {
                                AST_Node.warn("Side effects in last use of variable {name} [{file}:{line},{col}]", template(def.name));
                                side_effects.push(value);
                            }
                            value = null;
                            trim_defns.push(def);
                        }
                        var old_def;
                        if (!value && !(node instanceof AST_Let)) {
                            if (parent instanceof AST_ExportDeclaration) {
                                flush();
                            } else if (drop_sym && var_defs[sym.id] > 1) {
                                AST_Node.info("Dropping declaration of variable {name} [{file}:{line},{col}]", template(def.name));
                                var_defs[sym.id]--;
                                sym.eliminated++;
                            } else {
                                head.push(def);
                            }
                        } else if (compressor.option("functions")
                            && !compressor.option("ie")
                            && drop_sym
                            && var_defs[sym.id] == 1
                            && sym.assignments == 0
                            && value instanceof AST_LambdaExpression
                            && !is_arguments(sym)
                            && !is_arrow(value)
                            && assigned_once(value, sym.references)
                            && can_declare_defun(value)
                            && (old_def = rename_def(value, def.name.name)) !== false) {
                            AST_Node.warn("Declaring {name} as function [{file}:{line},{col}]", template(def.name));
                            var ctor;
                            switch (value.CTOR) {
                              case AST_AsyncFunction:
                                ctor = AST_AsyncDefun;
                                break;
                              case AST_AsyncGeneratorFunction:
                                ctor = AST_AsyncGeneratorDefun;
                                break;
                              case AST_Function:
                                ctor = AST_Defun;
                                break;
                              case AST_GeneratorFunction:
                                ctor = AST_GeneratorDefun;
                                break;
                            }
                            var defun = make_node(ctor, def, value);
                            defun.name = make_node(AST_SymbolDefun, def.name, def.name);
                            var name_def = def.name.scope.resolve().def_function(defun.name);
                            if (old_def) old_def.forEach(function(node) {
                                node.name = name_def.name;
                                node.thedef = name_def;
                                node.reference();
                            });
                            body.push(defun);
                        } else {
                            if (drop_sym
                                && var_defs[sym.id] > 1
                                && !(parent instanceof AST_ExportDeclaration)
                                && sym.orig.indexOf(def.name) > sym.eliminated) {
                                var_defs[sym.id]--;
                                duplicated++;
                            }
                            flush();
                        }
                    } else if (is_catch(def.name)) {
                        value = value && value.drop_side_effect_free(compressor);
                        if (value) side_effects.push(value);
                        if (var_defs[sym.id] > 1) {
                            AST_Node.warn("Dropping duplicated declaration of variable {name} [{file}:{line},{col}]", template(def.name));
                            var_defs[sym.id]--;
                            sym.eliminated++;
                        } else {
                            def.value = null;
                            head.push(def);
                        }
                    } else {
                        value = value && !value.single_use && value.drop_side_effect_free(compressor);
                        if (value) {
                            AST_Node.warn("Side effects in initialization of unused variable {name} [{file}:{line},{col}]", template(def.name));
                            side_effects.push(value);
                        } else {
                            log(def.name, "Dropping unused variable {name}");
                        }
                        sym.eliminated++;
                    }

                    function assigned_once(fn, refs) {
                        if (refs.length == 0) return fn === def.name.fixed_value();
                        return all(refs, function(ref) {
                            return fn === ref.fixed_value();
                        });
                    }

                    function can_declare_defun(fn) {
                        if (!is_var || compressor.has_directive("use strict") || !(fn instanceof AST_Function)) {
                            return parent instanceof AST_Scope;
                        }
                        return parent instanceof AST_Block
                            || parent instanceof AST_For && parent.init === node
                            || parent instanceof AST_If;
                    }

                    function rename_def(fn, name) {
                        if (!fn.name) return null;
                        var def = fn.name.definition();
                        if (def.orig.length > 1) return null;
                        if (def.assignments > 0) return false;
                        if (def.name == name) return def;
                        var forbidden;
                        switch (name) {
                          case "await":
                            forbidden = is_async;
                            break;
                          case "yield":
                            forbidden = is_generator;
                            break;
                        }
                        return all(def.references, function(ref) {
                            var scope = ref.scope;
                            if (scope.find_variable(name) !== sym) return false;
                            if (forbidden) do {
                                scope = scope.resolve();
                                if (forbidden(scope)) return false;
                            } while (scope !== fn && (scope = scope.parent_scope));
                            return true;
                        }) && def;
                    }

                    function is_catch(node) {
                        var sym = node.definition();
                        return sym.orig[0] instanceof AST_SymbolCatch && sym.scope.resolve() === node.scope.resolve();
                    }

                    function flush() {
                        if (side_effects.length > 0) {
                            if (tail.length == 0) {
                                body.push(make_node(AST_SimpleStatement, node, {
                                    body: make_sequence(node, side_effects),
                                }));
                            } else if (value) {
                                side_effects.push(value);
                                def.value = make_sequence(value, side_effects);
                            } else {
                                def.value = make_node(AST_UnaryPrefix, def, {
                                    operator: "void",
                                    expression: make_sequence(def, side_effects),
                                });
                            }
                            side_effects = [];
                        }
                        tail.push(def);
                    }
                });
                switch (head.length) {
                  case 0:
                    if (tail.length == 0) break;
                    if (tail.length == duplicated) {
                        [].unshift.apply(side_effects, tail.map(function(def) {
                            AST_Node.warn("Dropping duplicated definition of variable {name} [{file}:{line},{col}]", template(def.name));
                            var sym = def.name.definition();
                            var ref = make_node(AST_SymbolRef, def.name, def.name);
                            sym.references.push(ref);
                            var assign = make_node(AST_Assign, def, {
                                operator: "=",
                                left: ref,
                                right: def.value
                            });
                            var index = indexOf_assign(sym, def);
                            if (index >= 0) assign_in_use[sym.id][index] = assign;
                            sym.eliminated++;
                            return assign;
                        }));
                        break;
                    }
                  case 1:
                    if (tail.length == 0) {
                        var id = head[0].name.definition().id;
                        if (id in for_ins) {
                            node.definitions = head;
                            for_ins[id].init = node;
                            break;
                        }
                    }
                  default:
                    node.definitions = head.concat(tail);
                    body.push(node);
                }
                if (side_effects.length > 0) {
                    body.push(make_node(AST_SimpleStatement, node, {
                        body: make_sequence(node, side_effects)
                    }));
                }
                return insert_statements(body, node, in_list);
            }
            if (node instanceof AST_Assign) {
                descend(node, tt);
                if (!(node.left instanceof AST_Destructured)) return node;
                var trimmed = trim_destructured(node.left, node.right, function(node) {
                    return node;
                }, node.write_only === true);
                if (trimmed.name) return make_node(AST_Assign, node, {
                    operator: node.operator,
                    left: trimmed.name,
                    right: trimmed.value,
                });
                if (trimmed.value) return trimmed.value;
                if (parent instanceof AST_Sequence && parent.tail_node() !== node) return List.skip;
                return make_node(AST_Number, node, { value: 0 });
            }
            if (node instanceof AST_LabeledStatement && node.body instanceof AST_For) {
                // Certain combination of unused name + side effect leads to invalid AST:
                //    https://github.com/mishoo/UglifyJS/issues/1830
                // We fix it at this stage by moving the label inwards, back to the `for`.
                descend(node, tt);
                if (node.body instanceof AST_BlockStatement) {
                    var block = node.body;
                    node.body = block.body.pop();
                    block.body.push(node);
                    return in_list ? List.splice(block.body) : block;
                }
                return node;
            }
            if (node instanceof AST_Scope) {
                descend_scope();
                return node;
            }
            if (node instanceof AST_SymbolImport) {
                if (!compressor.option("imports") || node.definition().id in in_use_ids) return node;
                return in_list ? List.skip : null;
            }

            function descend_scope() {
                var save_scope = scope;
                scope = node;
                descend(node, tt);
                scope = save_scope;
            }
        }, function(node, in_list) {
            if (node instanceof AST_BlockStatement) return trim_block(node, tt.parent(), in_list);
            // Certain combination of unused name + side effect leads to invalid AST:
            //    https://github.com/mishoo/UglifyJS/issues/44
            //    https://github.com/mishoo/UglifyJS/issues/1838
            //    https://github.com/mishoo/UglifyJS/issues/3371
            // We fix it at this stage by moving the `var` outside the `for`.
            if (node instanceof AST_For) {
                var block;
                if (node.init instanceof AST_BlockStatement) {
                    block = node.init;
                    node.init = block.body.pop();
                    block.body.push(node);
                }
                if (node.init instanceof AST_Defun) {
                    if (!block) {
                        block = make_node(AST_BlockStatement, node, {
                            body: [ node ]
                        });
                    }
                    block.body.splice(-1, 0, node.init);
                    node.init = null;
                } else if (node.init instanceof AST_SimpleStatement) {
                    node.init = node.init.body;
                } else if (is_empty(node.init)) {
                    node.init = null;
                }
                return !block ? node : in_list ? List.splice(block.body) : block;
            }
            if (node instanceof AST_ForIn) {
                if (!drop_vars || !compressor.option("loops")) return;
                if (!is_empty(node.body)) return;
                var sym = get_init_symbol(node);
                if (!sym) return;
                var def = sym.definition();
                if (def.id in in_use_ids) return;
                log(sym, "Dropping unused loop variable {name}");
                if (for_ins[def.id] === node) delete for_ins[def.id];
                var body = [];
                var value = node.object.drop_side_effect_free(compressor);
                if (value) {
                    AST_Node.warn("Side effects in object of for-in loop [{file}:{line},{col}]", value.start);
                    body.push(make_node(AST_SimpleStatement, node, {
                        body: value
                    }));
                }
                if (node.init instanceof AST_Definitions && def.orig[0] instanceof AST_SymbolCatch) {
                    body.push(node.init);
                }
                return insert_statements(body, node, in_list);
            }
            if (node instanceof AST_Import) {
                if (node.properties && node.properties.length == 0) node.properties = null;
                return node;
            }
            if (node instanceof AST_Sequence) {
                if (node.expressions.length > 1) return;
                return maintain_this_binding(compressor, tt.parent(), node, node.expressions[0]);
            }
        });
        tt.push(compressor.parent());
        self.transform(tt);
        if (self instanceof AST_Lambda
            && self.body.length == 1
            && self.body[0] instanceof AST_Directive
            && self.body[0].value == "use strict") {
            self.body.length = 0;
        }
        trim_defns.forEach(function(def) {
            def.value = null;
        });
        unused_fn_names.forEach(function(fn) {
            fn.name = null;
        });
        calls_to_drop_args.forEach(function(call) {
            drop_unused_call_args(call, compressor, fns_with_marked_args);
        });

        function log(sym, text) {
            AST_Node[sym.definition().references.length > 0 ? "info" : "warn"](text + " [{file}:{line},{col}]", template(sym));
        }

        function template(sym) {
            return {
                name: sym.name,
                file: sym.start.file,
                line: sym.start.line,
                col : sym.start.col,
            };
        }

        function get_rvalue(expr) {
            return expr[expr instanceof AST_Assign ? "right" : "value"];
        }

        function insert_statements(body, orig, in_list) {
            switch (body.length) {
              case 0:
                return in_list ? List.skip : make_node(AST_EmptyStatement, orig);
              case 1:
                return body[0];
              default:
                return in_list ? List.splice(body) : make_node(AST_BlockStatement, orig, {
                    body: body
                });
            }
        }

        function track_assigns(def, node) {
            if (def.scope.resolve() !== self) return false;
            if (!def.fixed || !node.fixed) assign_in_use[def.id] = false;
            return assign_in_use[def.id] !== false;
        }

        function add_assigns(def, node) {
            if (!assign_in_use[def.id]) assign_in_use[def.id] = [];
            if (node.fixed.assigns) push_uniq(assign_in_use[def.id], node.fixed.assigns);
        }

        function indexOf_assign(def, node) {
            var nodes = assign_in_use[def.id];
            return nodes && nodes.indexOf(node);
        }

        function verify_safe_usage(def, read, modified) {
            if (def.id in in_use_ids) return;
            if (read && modified) {
                in_use_ids[def.id] = read;
                in_use.push(def);
            } else {
                value_read[def.id] = read;
                value_modified[def.id] = modified;
            }
        }

        function can_drop_lhs(sym, node) {
            var def = sym.definition();
            var in_use = in_use_ids[def.id];
            if (!in_use) return true;
            if (node[node instanceof AST_Assign ? "left" : "expression"] !== sym) return false;
            return in_use === sym && def.references.length - def.replaced == 1 || indexOf_assign(def, node) < 0;
        }

        function get_rhs(assign) {
            var rhs = assign.right;
            if (!assign.write_only) return rhs;
            if (!(rhs instanceof AST_Binary && lazy_op[rhs.operator])) return rhs;
            if (!(rhs.left instanceof AST_SymbolRef)) return rhs;
            if (!(assign.left instanceof AST_SymbolRef)) return rhs;
            var def = assign.left.definition();
            if (rhs.left.definition() !== def) return rhs;
            if (rhs.right.has_side_effects(compressor)) return rhs;
            if (track_assigns(def, rhs.left)) add_assigns(def, rhs.left);
            return rhs.right;
        }

        function get_init_symbol(for_in) {
            var init = for_in.init;
            if (init instanceof AST_Definitions) {
                init = init.definitions[0].name;
                return init instanceof AST_SymbolDeclaration && init;
            }
            while (init instanceof AST_PropAccess) init = init.expression.tail_node();
            if (init instanceof AST_SymbolRef) return init;
        }

        function scan_ref_scoped(node, descend, init) {
            if (node instanceof AST_Assign && node.left instanceof AST_SymbolRef) {
                var def = node.left.definition();
                if (def.scope.resolve() === self) assignments.add(def.id, node);
            }
            if (node instanceof AST_Unary && node.expression instanceof AST_SymbolRef) {
                var def = node.expression.definition();
                if (def.scope.resolve() === self) assignments.add(def.id, node);
            }
            var node_def, props = [], sym = assign_as_unused(node, props);
            if (sym && ((node_def = sym.definition()).scope.resolve() === self
                    || self.variables.get(sym.name) === node_def)
                && !(is_arguments(node_def) && !all(self.argnames, function(argname) {
                    return !argname.match_symbol(function(node) {
                        if (node instanceof AST_SymbolFunarg) {
                            var def = node.definition();
                            return def.references.length > def.replaced;
                        }
                    }, true);
                }))) {
                if (node.write_only === "p" && node.right.may_throw_on_access(compressor, true)) return;
                var assign = props.assign;
                if (assign) {
                    assign.write_only = true;
                    assign.walk(tw);
                }
                props.forEach(function(prop) {
                    prop.walk(tw);
                });
                if (node instanceof AST_Assign) {
                    var right = get_rhs(node), shared = false;
                    if (init && node.write_only === true && !right.has_side_effects(compressor)) {
                        initializations.add(node_def.id, right);
                    } else {
                        right.walk(tw);
                        shared = right.tail_node().operator == "=";
                    }
                    if (node.left === sym) {
                        if (!node.write_only || shared) {
                            verify_safe_usage(node_def, sym, value_modified[node_def.id]);
                        }
                    } else {
                        var fixed = sym.fixed_value();
                        if (!fixed || !fixed.is_constant()) {
                            verify_safe_usage(node_def, value_read[node_def.id], true);
                        }
                    }
                }
                if (track_assigns(node_def, sym) && is_lhs(sym, node) !== sym) add_assigns(node_def, sym);
                return true;
            }
            if (node instanceof AST_ForIn) {
                if (node.init instanceof AST_SymbolRef && scope === self) {
                    var id = node.init.definition().id;
                    if (!(id in for_ins)) for_ins[id] = node;
                }
                if (!drop_vars || !compressor.option("loops")) return;
                if (!is_empty(node.body)) return;
                if (node.init.has_side_effects(compressor)) return;
                var sym = get_init_symbol(node);
                if (!sym) return;
                var def = sym.definition();
                if (def.scope.resolve() !== self) {
                    var d = find_variable(sym.name);
                    if (d === def || d && d.redefined() === def) return;
                }
                node.object.walk(tw);
                return true;
            }
            if (node instanceof AST_SymbolRef) {
                node_def = node.definition();
                if (!(node_def.id in in_use_ids)) {
                    in_use_ids[node_def.id] = true;
                    in_use.push(node_def);
                }
                if (cross_scope(node_def.scope, node.scope)) {
                    var redef = node_def.redefined();
                    if (redef && !(redef.id in in_use_ids)) {
                        in_use_ids[redef.id] = true;
                        in_use.push(redef);
                    }
                }
                if (track_assigns(node_def, node)) add_assigns(node_def, node);
                return true;
            }
            if (node instanceof AST_Scope) {
                var save_scope = scope;
                scope = node;
                descend();
                scope = save_scope;
                return true;
            }
        }

        function is_decl(node) {
            return (node instanceof AST_DefaultValue ? node.name : node) instanceof AST_SymbolDeclaration;
        }

        function trim_default(trimmer, node) {
            node.value = node.value.transform(tt);
            var name = node.name.transform(trimmer);
            if (!name) {
                if (node.name instanceof AST_Destructured) return null;
                var value = node.value.drop_side_effect_free(compressor);
                if (!value) return null;
                log(node.name, "Side effects in default value of unused variable {name}");
                node.name.__unused = null;
                node.value = value;
            }
            return node;
        }

        function trim_destructured(node, value, process, drop) {
            var trimmer = new TreeTransformer(function(node) {
                if (node instanceof AST_DefaultValue) {
                    if (compressor.option("default_values") && value && value.is_defined(compressor)) {
                        node = node.name;
                    } else {
                        var save_drop = drop;
                        drop = false;
                        var trimmed = trim_default(trimmer, node);
                        drop = save_drop;
                        if (!trimmed && drop && value) value = value.drop_side_effect_free(compressor);
                        return trimmed;
                    }
                }
                if (node instanceof AST_DestructuredArray) {
                    var save_drop = drop;
                    var save_value = value;
                    if (value instanceof AST_SymbolRef) {
                        drop = false;
                        value = value.fixed_value();
                    }
                    var values = value instanceof AST_Array && value.elements;
                    var elements = [], newValues = drop && [], pos = 0;
                    node.elements.forEach(function(element, index) {
                        value = values && values[index];
                        if (value instanceof AST_Hole) {
                            value = null;
                        } else if (value instanceof AST_Spread) {
                            if (drop) {
                                newValues.length = pos;
                                fill_holes(save_value, newValues);
                                [].push.apply(newValues, values.slice(index));
                                save_value.elements = newValues;
                            }
                            value = values = false;
                        }
                        element = element.transform(trimmer);
                        if (element) elements[pos] = element;
                        if (drop && value) newValues[pos] = value;
                        if (element || value || !drop || !values) pos++;
                    });
                    value = values && make_node(AST_Array, save_value, {
                        elements: values.slice(node.elements.length),
                    });
                    if (node.rest) {
                        var was_drop = drop;
                        drop = false;
                        node.rest = node.rest.transform(compressor.option("rests") ? trimmer : tt);
                        drop = was_drop;
                        if (node.rest) elements.length = pos;
                    }
                    if (drop) {
                        if (value && !node.rest) value = value.drop_side_effect_free(compressor);
                        if (value instanceof AST_Array) {
                            value = value.elements;
                        } else if (value instanceof AST_Sequence) {
                            value = value.expressions;
                        } else if (value) {
                            value = [ value ];
                        }
                        if (value && value.length) {
                            newValues.length = pos;
                            [].push.apply(newValues, value);
                        }
                    }
                    value = save_value;
                    drop = save_drop;
                    if (values && newValues) {
                        fill_holes(value, newValues);
                        value.elements = newValues;
                    }
                    if (!node.rest && (value instanceof AST_Array
                        || value && value.is_string(compressor))) switch (elements.length) {
                      case 0:
                        if (drop) value = value.drop_side_effect_free(compressor);
                        return null;
                      case 1:
                        if (!drop) break;
                        var sym = elements[0];
                        if (!(sym instanceof AST_Symbol)) break;
                        value = make_node(AST_Sub, node, {
                            expression: value,
                            property: make_node(AST_Number, node, { value: 0 }),
                        });
                        return sym;
                    }
                    fill_holes(node, elements);
                    node.elements = elements;
                    return node;
                }
                if (node instanceof AST_DestructuredObject) {
                    var save_drop = drop;
                    var save_value = value;
                    if (value instanceof AST_SymbolRef) {
                        drop = false;
                        value = value.fixed_value();
                    }
                    var prop_keys, prop_map;
                    if (value instanceof AST_Object) {
                        prop_keys = [];
                        prop_map = Object.create(null);
                        value.properties.forEach(function(prop, index) {
                            if (prop instanceof AST_Spread) return prop_map = false;
                            var key = prop.key;
                            if (key instanceof AST_Node) key = key.evaluate(compressor, true);
                            if (key instanceof AST_Node) {
                                prop_map = false;
                            } else if (prop_map && !(prop instanceof AST_ObjectSetter)) {
                                prop_map[key] = prop;
                            }
                            prop_keys[index] = key;
                        });
                    }
                    if (node.rest) {
                        value = false;
                        node.rest = node.rest.transform(compressor.option("rests") ? trimmer : tt);
                    }
                    var can_drop = Object.create(null);
                    var drop_keys = drop && Object.create(null);
                    var properties = [];
                    node.properties.map(function(prop) {
                        var key = prop.key;
                        if (key instanceof AST_Node) {
                            prop.key = key = key.transform(tt);
                            key = key.evaluate(compressor, true);
                        }
                        if (key instanceof AST_Node) {
                            drop_keys = false;
                        } else {
                            can_drop[key] = !(key in can_drop);
                        }
                        return key;
                    }).forEach(function(key, index) {
                        var prop = node.properties[index], trimmed;
                        if (key instanceof AST_Node) {
                            drop = false;
                            value = false;
                            trimmed = prop.value.transform(trimmer) || retain_lhs(prop.value);
                        } else {
                            drop = drop_keys && can_drop[key];
                            var mapped = prop_map && prop_map[key];
                            if (mapped) {
                                value = mapped.value;
                                if (value instanceof AST_Accessor) value = false;
                            } else {
                                value = false;
                            }
                            trimmed = prop.value.transform(trimmer);
                            if (!trimmed) {
                                if (node.rest || retain_key(prop)) trimmed = retain_lhs(prop.value);
                                if (drop_keys && !(key in drop_keys)) {
                                    if (mapped) {
                                        drop_keys[key] = mapped;
                                        if (value === null) {
                                            prop_map[key] = retain_key(mapped) && make_node(AST_ObjectKeyVal, mapped, {
                                                key: mapped.key,
                                                value: make_node(AST_Number, mapped, { value: 0 }),
                                            });
                                        }
                                    } else {
                                        drop_keys[key] = true;
                                    }
                                }
                            } else if (drop_keys) {
                                drop_keys[key] = false;
                            }
                            if (value) mapped.value = value;
                        }
                        if (trimmed) {
                            prop.value = trimmed;
                            properties.push(prop);
                        }
                    });
                    value = save_value;
                    drop = save_drop;
                    if (drop_keys && prop_keys) value.properties = List(value.properties, function(prop, index) {
                        if (prop instanceof AST_Spread) return prop;
                        var key = prop_keys[index];
                        if (key instanceof AST_Node) return prop;
                        if (key in drop_keys) {
                            var mapped = drop_keys[key];
                            if (!mapped) return prop;
                            if (mapped === prop) return prop_map[key] || List.skip;
                        } else if (node.rest) {
                            return prop;
                        }
                        var trimmed = prop.value.drop_side_effect_free(compressor);
                        if (trimmed) {
                            prop.value = trimmed;
                            return prop;
                        }
                        return retain_key(prop) ? make_node(AST_ObjectKeyVal, prop, {
                            key: prop.key,
                            value: make_node(AST_Number, prop, { value: 0 }),
                        }) : List.skip;
                    });
                    if (value && !node.rest) switch (properties.length) {
                      case 0:
                        if (value.may_throw_on_access(compressor, true)) break;
                        if (drop) value = value.drop_side_effect_free(compressor);
                        return null;
                      case 1:
                        if (!drop) break;
                        var prop = properties[0];
                        if (prop.key instanceof AST_Node) break;
                        if (!(prop.value instanceof AST_Symbol)) break;
                        value = make_node(AST_Sub, node, {
                            expression: value,
                            property: make_node_from_constant(prop.key, prop),
                        });
                        return prop.value;
                    }
                    node.properties = properties;
                    return node;
                }
                if (node instanceof AST_Hole) {
                    node = null;
                } else {
                    node = process(node);
                }
                if (!node && drop && value) value = value.drop_side_effect_free(compressor);
                return node;
            });
            return {
                name: node.transform(trimmer),
                value: value,
            };

            function retain_key(prop) {
                return prop.key instanceof AST_Node && prop.key.has_side_effects(compressor);
            }

            function retain_lhs(node) {
                if (node instanceof AST_DefaultValue) return retain_lhs(node.name);
                if (node instanceof AST_Destructured) {
                    if (value === null) {
                        value = make_node(AST_Number, node, { value: 0 });
                    } else if (value) {
                        if (value.tail_node().write_only === true || value.may_throw_on_access(compressor, true)) {
                            value = make_node(AST_Array, node, {
                                elements: value instanceof AST_Sequence ? value.expressions : [ value ],
                            });
                        }
                    }
                    return make_node(AST_DestructuredObject, node, { properties: [] });
                }
                node.__unused = null;
                return node;
            }
        }
    });

    AST_Scope.DEFMETHOD("hoist_declarations", function(compressor) {
        if (compressor.has_directive("use asm")) return;
        var hoist_funs = compressor.option("hoist_funs");
        var hoist_vars = compressor.option("hoist_vars");
        var self = this;
        if (hoist_vars) {
            // let's count var_decl first, we seem to waste a lot of
            // space if we hoist `var` when there's only one.
            var var_decl = 0;
            self.walk(new TreeWalker(function(node) {
                if (var_decl > 1) return true;
                if (node instanceof AST_ExportDeclaration) return true;
                if (node instanceof AST_Scope && node !== self) return true;
                if (node instanceof AST_Var) {
                    var_decl++;
                    return true;
                }
            }));
            if (var_decl <= 1) hoist_vars = false;
        }
        if (!hoist_funs && !hoist_vars) return;
        var consts = Object.create(null);
        var dirs = [];
        var hoisted = [];
        var vars = new Dictionary(), vars_found = 0;
        var tt = new TreeTransformer(function(node, descend, in_list) {
            if (node === self) return;
            if (node instanceof AST_Directive) {
                dirs.push(node);
                return in_list ? List.skip : make_node(AST_EmptyStatement, node);
            }
            if (node instanceof AST_LambdaDefinition) {
                if (!hoist_funs) return node;
                var p = tt.parent();
                if (p instanceof AST_ExportDeclaration) return node;
                if (p instanceof AST_ExportDefault) return node;
                if (p !== self && compressor.has_directive("use strict")) return node;
                hoisted.push(node);
                return in_list ? List.skip : make_node(AST_EmptyStatement, node);
            }
            if (node instanceof AST_Var) {
                if (!hoist_vars) return node;
                var p = tt.parent();
                if (p instanceof AST_ExportDeclaration) return node;
                if (!all(node.definitions, function(defn) {
                    var sym = defn.name;
                    return sym instanceof AST_SymbolVar
                        && !consts[sym.name]
                        && self.find_variable(sym.name) === sym.definition();
                })) return node;
                node.definitions.forEach(function(def) {
                    vars.set(def.name.name, def);
                    ++vars_found;
                });
                var seq = node.to_assignments();
                if (p instanceof AST_ForEnumeration && p.init === node) {
                    if (seq) return seq;
                    var def = node.definitions[0].name;
                    return make_node(AST_SymbolRef, def, def);
                }
                if (p instanceof AST_For && p.init === node) return seq;
                if (!seq) return in_list ? List.skip : make_node(AST_EmptyStatement, node);
                return make_node(AST_SimpleStatement, node, { body: seq });
            }
            if (node instanceof AST_Scope) return node;
            if (node instanceof AST_SymbolConst) {
                consts[node.name] = true;
                return node;
            }
        });
        self.transform(tt);
        if (vars_found > 0) {
            // collect only vars which don't show up in self's arguments list
            var defs = [];
            if (self instanceof AST_Lambda) self.each_argname(function(argname) {
                vars.del(argname.name);
            });
            vars.each(function(def, name) {
                def = def.clone();
                def.value = null;
                defs.push(def);
                vars.set(name, def);
            });
            if (defs.length > 0) {
                // try to merge in assignments
                insert_vars(self.body);
                defs = make_node(AST_Var, self, { definitions: defs });
                hoisted.push(defs);
            }
        }
        self.body = dirs.concat(hoisted, self.body);

        function insert_vars(body) {
            while (body.length) {
                var stat = body[0];
                if (stat instanceof AST_SimpleStatement) {
                    var expr = stat.body, sym, assign;
                    if (expr instanceof AST_Assign
                        && expr.operator == "="
                        && (sym = expr.left) instanceof AST_Symbol
                        && vars.has(sym.name)) {
                        var def = vars.get(sym.name);
                        if (def.value) break;
                        var value = expr.right;
                        if (value instanceof AST_Sequence) value = value.clone();
                        def.value = value;
                        remove(defs, def);
                        defs.push(def);
                        body.shift();
                        continue;
                    }
                    if (expr instanceof AST_Sequence
                        && (assign = expr.expressions[0]) instanceof AST_Assign
                        && assign.operator == "="
                        && (sym = assign.left) instanceof AST_Symbol
                        && vars.has(sym.name)) {
                        var def = vars.get(sym.name);
                        if (def.value) break;
                        def.value = assign.right;
                        remove(defs, def);
                        defs.push(def);
                        stat.body = make_sequence(expr, expr.expressions.slice(1));
                        continue;
                    }
                }
                if (stat instanceof AST_EmptyStatement) {
                    body.shift();
                    continue;
                }
                if (stat instanceof AST_BlockStatement && !insert_vars(stat.body)) {
                    body.shift();
                    continue;
                }
                break;
            }
            return body.length;
        }
    });

    function scan_local_returns(fn, transform) {
        fn.walk(new TreeWalker(function(node) {
            if (node instanceof AST_Return) {
                transform(node);
                return true;
            }
            if (node instanceof AST_Scope && node !== fn) return true;
        }));
    }

    function map_bool_returns(fn) {
        var map = Object.create(null);
        scan_local_returns(fn, function(node) {
            var value = node.value;
            if (value) value = value.tail_node();
            if (value instanceof AST_SymbolRef) {
                var id = value.definition().id;
                map[id] = (map[id] || 0) + 1;
            }
        });
        return map;
    }

    function all_bool(def, bool_returns, compressor) {
        return def.bool_fn + (bool_returns[def.id] || 0) === def.references.length - def.replaced
            && !compressor.exposed(def);
    }

    function process_boolean_returns(fn, compressor) {
        scan_local_returns(fn, function(node) {
            node.in_bool = true;
            var value = node.value;
            if (value) {
                var ev = fuzzy_eval(compressor, value);
                if (!ev) {
                    value = value.drop_side_effect_free(compressor);
                    node.value = value ? make_sequence(node.value, [
                        value,
                        make_node(AST_Number, node.value, { value: 0 }),
                    ]) : null;
                } else if (!(ev instanceof AST_Node)) {
                    value = value.drop_side_effect_free(compressor);
                    node.value = value ? make_sequence(node.value, [
                        value,
                        make_node(AST_Number, node.value, { value: 1 }),
                    ]) : make_node(AST_Number, node.value, { value: 1 });
                }
            }
        });
    }

    AST_Scope.DEFMETHOD("process_boolean_returns", noop);
    AST_Defun.DEFMETHOD("process_boolean_returns", function(compressor) {
        if (!compressor.option("booleans")) return;
        var bool_returns = map_bool_returns(this);
        if (!all_bool(this.name.definition(), bool_returns, compressor)) return;
        if (compressor.parent() instanceof AST_ExportDefault) return;
        process_boolean_returns(this, compressor);
    });
    AST_Function.DEFMETHOD("process_boolean_returns", function(compressor) {
        if (!compressor.option("booleans")) return;
        var bool_returns = map_bool_returns(this);
        if (this.name && !all_bool(this.name.definition(), bool_returns, compressor)) return;
        var parent = compressor.parent();
        if (parent instanceof AST_Assign) {
            if (parent.operator != "=") return;
            var sym = parent.left;
            if (!(sym instanceof AST_SymbolRef)) return;
            if (!all_bool(sym.definition(), bool_returns, compressor)) return;
        } else if (parent instanceof AST_Call && parent.expression !== this) {
            var exp = parent.expression;
            if (exp instanceof AST_SymbolRef) exp = exp.fixed_value();
            if (!(exp instanceof AST_Lambda)) return;
            if (exp.uses_arguments || exp.pinned()) return;
            var sym = exp.argnames[parent.args.indexOf(this)];
            if (sym instanceof AST_DefaultValue) sym = sym.name;
            if (sym instanceof AST_SymbolFunarg && !all_bool(sym.definition(), bool_returns, compressor)) return;
        } else if (parent.TYPE == "Call") {
            compressor.pop();
            var in_bool = compressor.in_boolean_context();
            compressor.push(this);
            if (!in_bool) return;
        } else return;
        process_boolean_returns(this, compressor);
    });

    AST_BlockScope.DEFMETHOD("var_names", function() {
        var var_names = this._var_names;
        if (!var_names) {
            this._var_names = var_names = Object.create(null);
            this.enclosed.forEach(function(def) {
                var_names[def.name] = true;
            });
            this.variables.each(function(def, name) {
                var_names[name] = true;
            });
        }
        return var_names;
    });

    AST_Scope.DEFMETHOD("make_var", function(type, orig, prefix) {
        var scopes = [ this ];
        if (orig instanceof AST_SymbolDeclaration) orig.definition().references.forEach(function(ref) {
            var s = ref.scope;
            if (member(s, scopes)) return;
            do {
                push_uniq(scopes, s);
                s = s.parent_scope;
            } while (s && s !== this);
        });
        prefix = prefix.replace(/(?:^[^a-z_$]|[^a-z0-9_$])/ig, "_");
        var name = prefix;
        for (var i = 0; !all(scopes, function(scope) {
            return !scope.var_names()[name];
        }); i++) name = prefix + "$" + i;
        var sym = make_node(type, orig, {
            name: name,
            scope: this,
        });
        var def = this.def_variable(sym);
        scopes.forEach(function(scope) {
            scope.enclosed.push(def);
            scope.var_names()[name] = true;
        });
        return sym;
    });

    AST_Scope.DEFMETHOD("hoist_properties", function(compressor) {
        if (!compressor.option("hoist_props") || compressor.has_directive("use asm")) return;
        var self = this;
        var top_retain = self instanceof AST_Toplevel && compressor.top_retain || return_false;
        var defs_by_id = Object.create(null);
        self.transform(new TreeTransformer(function(node, descend) {
            if (node instanceof AST_Assign) {
                if (node.operator != "=") return;
                if (!node.write_only) return;
                if (!can_hoist(node.left, node.right, 1)) return;
                descend(node, this);
                var defs = new Dictionary();
                var assignments = [];
                var decls = [];
                node.right.properties.forEach(function(prop) {
                    var decl = make_sym(AST_SymbolVar, node.left, prop.key);
                    decls.push(make_node(AST_VarDef, node, {
                        name: decl,
                        value: null,
                    }));
                    var sym = make_node(AST_SymbolRef, node, {
                        name: decl.name,
                        scope: self,
                        thedef: decl.definition(),
                    });
                    sym.reference();
                    assignments.push(make_node(AST_Assign, node, {
                        operator: "=",
                        left: sym,
                        right: prop.value,
                    }));
                });
                defs_by_id[node.left.definition().id] = defs;
                self.body.splice(self.body.indexOf(this.stack[1]) + 1, 0, make_node(AST_Var, node, {
                    definitions: decls,
                }));
                return make_sequence(node, assignments);
            }
            if (node instanceof AST_Scope) return node === self ? undefined : node;
            if (node instanceof AST_VarDef) {
                if (!can_hoist(node.name, node.value, 0)) return;
                descend(node, this);
                var defs = new Dictionary();
                var var_defs = [];
                node.value.properties.forEach(function(prop) {
                    var_defs.push(make_node(AST_VarDef, node, {
                        name: make_sym(node.name.CTOR, node.name, prop.key),
                        value: prop.value,
                    }));
                });
                defs_by_id[node.name.definition().id] = defs;
                return List.splice(var_defs);
            }

            function make_sym(type, sym, key) {
                var new_var = self.make_var(type, sym, sym.name + "_" + key);
                defs.set(key, new_var.definition());
                return new_var;
            }
        }));
        self.transform(new TreeTransformer(function(node, descend) {
            if (node instanceof AST_PropAccess) {
                if (!(node.expression instanceof AST_SymbolRef)) return;
                var defs = defs_by_id[node.expression.definition().id];
                if (!defs) return;
                var def = defs.get(node.get_property());
                var sym = make_node(AST_SymbolRef, node, {
                    name: def.name,
                    scope: node.expression.scope,
                    thedef: def,
                });
                sym.reference();
                return sym;
            }
            if (node instanceof AST_SymbolRef) {
                if (!(node.definition().id in defs_by_id)) return;
                return make_node(AST_Object, node, { properties: [] });
            }
        }));

        function can_hoist(sym, right, count) {
            if (!(sym instanceof AST_Symbol)) return;
            var def = sym.definition();
            if (def.assignments != count) return;
            if (def.direct_access) return;
            if (def.escaped.depth == 1) return;
            if (def.references.length - def.replaced == count) return;
            if (def.single_use) return;
            if (top_retain(def)) return;
            if (sym.fixed_value() !== right) return;
            return right instanceof AST_Object
                && right.properties.length > 0
                && all(right.properties, can_hoist_property)
                && all(def.references, function(ref) {
                    return ref.fixed_value() === right;
                })
                && can_drop_symbol(sym, compressor);
        }
    });

    function fn_name_unused(fn, compressor) {
        if (!fn.name || !compressor.option("ie")) return true;
        var def = fn.name.definition();
        if (compressor.exposed(def)) return false;
        return all(def.references, function(sym) {
            return !(sym instanceof AST_SymbolRef);
        });
    }

    // drop_side_effect_free()
    // remove side-effect-free parts which only affects return value
    (function(def) {
        // Drop side-effect-free elements from an array of expressions.
        // Returns an array of expressions with side-effects or null
        // if all elements were dropped. Note: original array may be
        // returned if nothing changed.
        function trim(nodes, compressor, first_in_statement, spread) {
            var len = nodes.length;
            var ret = [], changed = false;
            for (var i = 0; i < len; i++) {
                var node = nodes[i];
                var trimmed;
                if (spread && node instanceof AST_Spread) {
                    trimmed = spread(node, compressor, first_in_statement);
                } else {
                    trimmed = node.drop_side_effect_free(compressor, first_in_statement);
                }
                if (trimmed !== node) changed = true;
                if (trimmed) {
                    ret.push(trimmed);
                    first_in_statement = false;
                }
            }
            return ret.length ? changed ? ret : nodes : null;
        }
        function array_spread(node, compressor, first_in_statement) {
            var exp = node.expression;
            if (!exp.is_string(compressor)) return node;
            return exp.drop_side_effect_free(compressor, first_in_statement);
        }
        function convert_spread(node) {
            return node instanceof AST_Spread ? make_node(AST_Array, node, {
                elements: [ node ]
            }) : node;
        }
        def(AST_Node, return_this);
        def(AST_Accessor, return_null);
        def(AST_Array, function(compressor, first_in_statement) {
            var values = trim(this.elements, compressor, first_in_statement, array_spread);
            if (!values) return null;
            if (values === this.elements && all(values, function(node) {
                return node instanceof AST_Spread;
            })) return this;
            return make_sequence(this, values.map(convert_spread));
        });
        def(AST_Assign, function(compressor) {
            var left = this.left;
            if (left instanceof AST_PropAccess) {
                var expr = left.expression;
                if (expr.may_throw_on_access(compressor, true)) return this;
                if (compressor.has_directive("use strict") && expr.is_constant()) return this;
            }
            if (left.has_side_effects(compressor)) return this;
            var right = this.right;
            if (!lazy_op[this.operator.slice(0, -1)]) {
                this.write_only = true;
                if (root_expr(left).is_constant_expression(compressor.find_parent(AST_Scope))) {
                    return right.drop_side_effect_free(compressor);
                }
            }
            return this;
        });
        def(AST_Await, function(compressor) {
            if (!compressor.option("awaits")) return this;
            var exp = this.expression;
            if (!is_primitive(compressor, exp)) return this;
            var node = this.clone();
            node.expression = exp.drop_side_effect_free(compressor) || make_node(AST_Number, this, { value: 0 });
            return node;
        });
        def(AST_Binary, function(compressor, first_in_statement) {
            var left = this.left;
            var right = this.right;
            var op = this.operator;
            if (op == "in" && !is_object(right)) {
                var lhs = left.drop_side_effect_free(compressor, first_in_statement);
                if (lhs === left) return this;
                var node = this.clone();
                node.left = lhs || make_node(AST_Number, left, { value: 0 });
                return node;
            }
            var rhs = right.drop_side_effect_free(compressor, first_in_statement);
            if (!rhs) return left.drop_side_effect_free(compressor, first_in_statement);
            if (lazy_op[op] && rhs.has_side_effects(compressor)) {
                var node = this;
                if (rhs !== right) {
                    node = node.clone();
                    node.right = rhs.drop_side_effect_free(compressor);
                }
                if (op == "??") return node;
                var negated = make_node(AST_Binary, this, {
                    operator: op == "&&" ? "||" : "&&",
                    left: left.negate(compressor, first_in_statement),
                    right: node.right,
                });
                return first_in_statement ? best_of_statement(node, negated) : best_of_expression(node, negated);
            }
            var lhs = left.drop_side_effect_free(compressor, first_in_statement);
            if (!lhs) return rhs;
            rhs = rhs.drop_side_effect_free(compressor);
            if (!rhs) return lhs;
            return make_sequence(this, [ lhs, rhs ]);
        });
        function drop_returns(compressor, exp) {
            var arrow = is_arrow(exp);
            var async = is_async(exp);
            var drop_body = false;
            if (arrow && compressor.option("arrows")) {
                if (!exp.value) {
                    drop_body = true;
                } else if (!async || is_primitive(compressor, exp.value)) {
                    exp.value = exp.value.drop_side_effect_free(compressor);
                }
            } else if (exp instanceof AST_AsyncFunction || exp instanceof AST_Function) {
                if (exp.name) {
                    var def = exp.name.definition();
                    drop_body = def.references.length == def.replaced;
                } else {
                    drop_body = true;
                }
            }
            if (drop_body) {
                exp.process_expression(false, function(node) {
                    var value = node.value;
                    if (value) {
                        if (async && !is_primitive(compressor, value)) return node;
                        value = value.drop_side_effect_free(compressor, true);
                    }
                    if (!value) return make_node(AST_EmptyStatement, node);
                    return make_node(AST_SimpleStatement, node, { body: value });
                });
                scan_local_returns(exp, function(node) {
                    var value = node.value;
                    if (value) {
                        if (async && !is_primitive(compressor, value)) return;
                        node.value = value.drop_side_effect_free(compressor);
                    }
                });
            }
            if (async && compressor.option("awaits")) {
                if (drop_body) exp.process_expression("awaits", function(node) {
                    var body = node.body;
                    if (body instanceof AST_Await) {
                        if (is_primitive(compressor, body.expression)) {
                            body = body.expression.drop_side_effect_free(compressor, true);
                            if (!body) return make_node(AST_EmptyStatement, node);
                            node.body = body;
                        }
                    } else if (body instanceof AST_Sequence) {
                        var exprs = body.expressions;
                        for (var i = exprs.length; --i >= 0;) {
                            var tail = exprs[i];
                            if (!(tail instanceof AST_Await)) break;
                            if (!is_primitive(compressor, tail.expression)) break;
                            if (exprs[i] = tail.expression.drop_side_effect_free(compressor)) break;
                        }
                        switch (i) {
                          case -1:
                            return make_node(AST_EmptyStatement, node);
                          case 0:
                            node.body = exprs[0];
                            break;
                          default:
                            exprs.length = i + 1;
                            break;
                        }
                    }
                    return node;
                });
                var abort = !drop_body && exp.name || arrow && exp.value && !is_primitive(compressor, exp.value);
                var tw = new TreeWalker(function(node) {
                    if (abort) return true;
                    if (tw.parent() === exp && node.may_throw(compressor)) return abort = true;
                    if (node instanceof AST_Await) return abort = true;
                    if (node instanceof AST_ForAwaitOf) return abort = true;
                    if (node instanceof AST_Return) {
                        if (node.value && !is_primitive(compressor, node.value)) return abort = true;
                        return;
                    }
                    if (node instanceof AST_Scope && node !== exp) return true;
                });
                exp.walk(tw);
                if (!abort) {
                    var ctor;
                    switch (exp.CTOR) {
                      case AST_AsyncArrow:
                        ctor = AST_Arrow;
                        break;
                      case AST_AsyncFunction:
                        ctor = AST_Function;
                        break;
                      case AST_AsyncGeneratorFunction:
                        ctor = AST_GeneratorFunction;
                        break;
                    }
                    return make_node(ctor, exp, exp);
                }
            }
            return drop_body && exp.clone();
        }
        def(AST_Call, function(compressor, first_in_statement) {
            var self = this;
            if (self.is_expr_pure(compressor)) {
                if (self.pure) AST_Node.warn("Dropping __PURE__ call [{file}:{line},{col}]", self.start);
                var args = trim(self.args, compressor, first_in_statement, array_spread);
                return args && make_sequence(self, args.map(convert_spread));
            }
            var exp = self.expression;
            if (self.is_call_pure(compressor)) {
                var exprs = self.args.slice();
                exprs.unshift(exp.expression);
                exprs = trim(exprs, compressor, first_in_statement, array_spread);
                return exprs && make_sequence(self, exprs.map(convert_spread));
            }
            if (compressor.option("yields") && is_generator(exp)) {
                var call = self.clone();
                call.expression = make_node(AST_Function, exp, exp);
                call.expression.body = [];
                var opt = call.transform(compressor);
                if (opt !== call) return opt.drop_side_effect_free(compressor, first_in_statement);
            }
            var dropped = drop_returns(compressor, exp);
            if (dropped) {
                // always shallow clone to ensure stripping of negated IIFEs
                self = self.clone();
                self.expression = dropped;
                // avoid extraneous traversal
                if (exp._squeezed) self.expression._squeezed = true;
            }
            if (self instanceof AST_New) {
                var fn = exp;
                if (fn instanceof AST_SymbolRef) fn = fn.fixed_value();
                if (fn instanceof AST_Lambda) {
                    fn.new = true;
                    var assign_this_only = all(fn.body, function(stat) {
                        return !stat.has_side_effects(compressor);
                    });
                    delete fn.new;
                    if (assign_this_only) {
                        var exprs = self.args.slice();
                        exprs.unshift(exp);
                        exprs = trim(exprs, compressor, first_in_statement, array_spread);
                        return exprs && make_sequence(self, exprs.map(convert_spread));
                    }
                    if (!fn.contains_this()) return make_node(AST_Call, self, self);
                }
            }
            return self;
        });
        function drop_class(self, compressor, first_in_statement) {
            var exprs = [], values = [];
            var props = self.properties;
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                if (prop.key instanceof AST_Node) exprs.push(prop.key);
                if (prop.static && prop.value
                    && prop instanceof AST_ClassField
                    && prop.value.has_side_effects(compressor)) {
                    if (prop.value.contains_this()) return self;
                    values.push(prop.value);
                }
            }
            var base = self.extends;
            if (base) {
                if (base instanceof AST_SymbolRef) base = base.fixed_value();
                base = !safe_for_extends(base);
                if (!base) exprs.unshift(self.extends);
            }
            exprs = trim(exprs, compressor, first_in_statement);
            if (exprs) first_in_statement = false;
            values = trim(values, compressor, first_in_statement);
            if (!exprs) {
                if (!base && !values) return null;
                exprs = [];
            }
            if (base) {
                var node = to_class_expr(self, true);
                node.properties = [];
                if (exprs.length) node.properties.push(make_node(AST_ClassMethod, self, {
                    key: make_sequence(self, exprs),
                    value: make_node(AST_Function, self, {
                        argnames: [],
                        body: [],
                    }).init_vars(node),
                }));
                exprs = [ node ];
            }
            if (values) exprs.push(make_node(AST_Call, self, {
                expression: make_node(AST_Arrow, self, {
                    argnames: [],
                    body: [],
                    value: make_sequence(self, values),
                }).init_vars(self.parent_scope),
                args: [],
            }));
            return make_sequence(self, exprs);
        }
        def(AST_ClassExpression, function(compressor, first_in_statement) {
            var self = this;
            var name = self.name;
            if (name && name.fixed_value() !== self && name.definition().references.length > 0) return self;
            return drop_class(self, compressor, first_in_statement);
        });
        def(AST_Conditional, function(compressor) {
            var consequent = this.consequent.drop_side_effect_free(compressor);
            var alternative = this.alternative.drop_side_effect_free(compressor);
            if (consequent === this.consequent && alternative === this.alternative) return this;
            var exprs;
            if (compressor.option("ie")) {
                exprs = [];
                if (consequent instanceof AST_Function) {
                    exprs.push(consequent);
                    consequent = null;
                }
                if (alternative instanceof AST_Function) {
                    exprs.push(alternative);
                    alternative = null;
                }
            }
            var node;
            if (!consequent) {
                node = alternative ? make_node(AST_Binary, this, {
                    operator: "||",
                    left: this.condition,
                    right: alternative
                }) : this.condition.drop_side_effect_free(compressor);
            } else if (!alternative) {
                node = make_node(AST_Binary, this, {
                    operator: "&&",
                    left: this.condition,
                    right: consequent
                });
            } else {
                node = this.clone();
                node.consequent = consequent;
                node.alternative = alternative;
            }
            if (!compressor.option("ie")) return node;
            if (node) exprs.push(node);
            return exprs.length == 0 ? null : make_sequence(this, exprs);
        });
        def(AST_Constant, return_null);
        def(AST_DefClass, function(compressor, first_in_statement) {
            return drop_class(this, compressor, first_in_statement);
        });
        def(AST_Dot, function(compressor, first_in_statement) {
            var expr = this.expression;
            if (!this.optional && expr.may_throw_on_access(compressor)) return this;
            return expr.drop_side_effect_free(compressor, first_in_statement);
        });
        def(AST_Function, function(compressor) {
            return fn_name_unused(this, compressor) ? null : this;
        });
        def(AST_LambdaExpression, return_null);
        def(AST_Object, function(compressor, first_in_statement) {
            var exprs = [];
            this.properties.forEach(function(prop) {
                if (prop instanceof AST_Spread) {
                    exprs.push(prop);
                } else {
                    if (prop.key instanceof AST_Node) exprs.push(prop.key);
                    exprs.push(prop.value);
                }
            });
            var values = trim(exprs, compressor, first_in_statement, function(node, compressor, first_in_statement) {
                var exp = node.expression;
                return spread_side_effects(exp) ? node : exp.drop_side_effect_free(compressor, first_in_statement);
            });
            if (!values) return null;
            if (values === exprs && !all(values, function(node) {
                return !(node instanceof AST_Spread);
            })) return this;
            return make_sequence(this, values.map(function(node) {
                return node instanceof AST_Spread ? make_node(AST_Object, node, {
                    properties: [ node ],
                }) : node;
            }));
        });
        def(AST_ObjectIdentity, return_null);
        def(AST_Sequence, function(compressor, first_in_statement) {
            var expressions = trim(this.expressions, compressor, first_in_statement);
            if (!expressions) return null;
            var end = expressions.length - 1;
            var last = expressions[end];
            if (compressor.option("awaits") && end > 0 && last instanceof AST_Await && last.expression.is_constant()) {
                expressions = expressions.slice(0, -1);
                end--;
                last.expression = expressions[end];
                expressions[end] = last;
            }
            var assign, cond, lhs;
            if (compressor.option("conditionals")
                && end > 0
                && (assign = expressions[end - 1]) instanceof AST_Assign
                && assign.operator == "="
                && (lhs = assign.left) instanceof AST_SymbolRef
                && (cond = to_conditional_assignment(compressor, lhs.definition(), assign.right, last))) {
                assign = assign.clone();
                assign.right = cond;
                expressions = expressions.slice(0, -2);
                expressions.push(assign.drop_side_effect_free(compressor, first_in_statement));
            }
            return expressions === this.expressions ? this : make_sequence(this, expressions);
        });
        def(AST_Sub, function(compressor, first_in_statement) {
            var expr = this.expression;
            var prop = this.property;
            if (expr.may_throw_on_access(compressor)) {
                if (!this.optional) return this;
                if (prop.has_side_effects(compressor)) {
                    prop = prop.drop_side_effect_free(compressor);
                    if (!prop) return expr.drop_side_effect_free(compressor, first_in_statement);
                    var node = this.clone();
                    node.property = prop;
                    return node;
                }
            }
            expr = expr.drop_side_effect_free(compressor, first_in_statement);
            if (!expr) return prop.drop_side_effect_free(compressor, first_in_statement);
            prop = prop.drop_side_effect_free(compressor);
            if (!prop) return expr;
            return make_sequence(this, [ expr, prop ]);
        });
        def(AST_SymbolRef, function(compressor) {
            return this.is_declared(compressor) && can_drop_symbol(this, compressor) ? null : this;
        });
        def(AST_Template, function(compressor, first_in_statement) {
            var self = this;
            if (self.is_expr_pure(compressor)) {
                var expressions = self.expressions;
                if (expressions.length == 0) return null;
                return make_sequence(self, expressions).drop_side_effect_free(compressor, first_in_statement);
            }
            var tag = self.tag;
            var dropped = drop_returns(compressor, tag);
            if (dropped) {
                // always shallow clone to signal internal changes
                self = self.clone();
                self.tag = dropped;
                // avoid extraneous traversal
                if (tag._squeezed) self.tag._squeezed = true;
            }
            return self;
        });
        def(AST_Unary, function(compressor, first_in_statement) {
            var exp = this.expression;
            if (unary_side_effects[this.operator]) {
                this.write_only = !exp.has_side_effects(compressor);
                return this;
            }
            if (this.operator == "typeof" && exp instanceof AST_SymbolRef && can_drop_symbol(exp, compressor)) {
                return null;
            }
            var node = exp.drop_side_effect_free(compressor, first_in_statement);
            if (first_in_statement && node && is_iife_call(node)) {
                if (node === exp && this.operator == "!") return this;
                return node.negate(compressor, first_in_statement);
            }
            return node;
        });
    })(function(node, func) {
        node.DEFMETHOD("drop_side_effect_free", func);
    });

    OPT(AST_SimpleStatement, function(self, compressor) {
        if (compressor.option("side_effects")) {
            var body = self.body;
            var node = body.drop_side_effect_free(compressor, true);
            if (!node) {
                AST_Node.warn("Dropping side-effect-free statement [{file}:{line},{col}]", self.start);
                return make_node(AST_EmptyStatement, self);
            }
            if (node !== body) {
                return make_node(AST_SimpleStatement, self, { body: node });
            }
        }
        return self;
    });

    OPT(AST_While, function(self, compressor) {
        return compressor.option("loops") ? make_node(AST_For, self, self).optimize(compressor) : self;
    });

    function has_loop_control(loop, parent, type) {
        if (!type) type = AST_LoopControl;
        var found = false;
        var tw = new TreeWalker(function(node) {
            if (found || node instanceof AST_Scope) return true;
            if (node instanceof type && tw.loopcontrol_target(node) === loop) {
                return found = true;
            }
        });
        if (parent instanceof AST_LabeledStatement) tw.push(parent);
        tw.push(loop);
        loop.body.walk(tw);
        return found;
    }

    OPT(AST_Do, function(self, compressor) {
        if (!compressor.option("loops")) return self;
        var cond = fuzzy_eval(compressor, self.condition);
        if (!(cond instanceof AST_Node)) {
            if (cond && !has_loop_control(self, compressor.parent(), AST_Continue)) return make_node(AST_For, self, {
                body: make_node(AST_BlockStatement, self.body, {
                    body: [
                        self.body,
                        make_node(AST_SimpleStatement, self.condition, {
                            body: self.condition
                        }),
                    ]
                })
            }).optimize(compressor);
            if (!has_loop_control(self, compressor.parent())) return make_node(AST_BlockStatement, self.body, {
                body: [
                    self.body,
                    make_node(AST_SimpleStatement, self.condition, {
                        body: self.condition
                    }),
                ]
            }).optimize(compressor);
        }
        if (self.body instanceof AST_BlockStatement && !has_loop_control(self, compressor.parent(), AST_Continue)) {
            var body = self.body.body;
            for (var i = body.length; --i >= 0;) {
                var stat = body[i];
                if (stat instanceof AST_If
                    && !stat.alternative
                    && stat.body instanceof AST_Break
                    && compressor.loopcontrol_target(stat.body) === self) {
                    if (has_block_scope_refs(stat.condition)) break;
                    self.condition = make_node(AST_Binary, self, {
                        operator: "&&",
                        left: stat.condition.negate(compressor),
                        right: self.condition,
                    });
                    body.splice(i, 1);
                } else if (stat instanceof AST_SimpleStatement) {
                    if (has_block_scope_refs(stat.body)) break;
                    self.condition = make_sequence(self, [
                        stat.body,
                        self.condition,
                    ]);
                    body.splice(i, 1);
                } else if (!is_declaration(stat, true)) {
                    break;
                }
            }
            self.body = trim_block(self.body, compressor.parent());
        }
        if (self.body instanceof AST_EmptyStatement) return make_node(AST_For, self, self).optimize(compressor);
        if (self.body instanceof AST_SimpleStatement) return make_node(AST_For, self, {
            condition: make_sequence(self.condition, [
                self.body.body,
                self.condition
            ]),
            body: make_node(AST_EmptyStatement, self)
        }).optimize(compressor);
        return self;

        function has_block_scope_refs(node) {
            var found = false;
            node.walk(new TreeWalker(function(node) {
                if (found) return true;
                if (node instanceof AST_SymbolRef) {
                    if (!member(node.definition(), self.enclosed)) found = true;
                    return true;
                }
            }));
            return found;
        }
    });

    function if_break_in_loop(self, compressor) {
        var first = first_statement(self.body);
        if (compressor.option("dead_code")
            && (first instanceof AST_Break
                || first instanceof AST_Continue && external_target(first)
                || first instanceof AST_Exit)) {
            var body = [];
            if (is_statement(self.init)) {
                body.push(self.init);
            } else if (self.init) {
                body.push(make_node(AST_SimpleStatement, self.init, {
                    body: self.init
                }));
            }
            var retain = external_target(first) || first instanceof AST_Exit;
            if (self.condition && retain) {
                body.push(make_node(AST_If, self, {
                    condition: self.condition,
                    body: first,
                    alternative: null
                }));
            } else if (self.condition) {
                body.push(make_node(AST_SimpleStatement, self.condition, {
                    body: self.condition
                }));
            } else if (retain) {
                body.push(first);
            }
            extract_declarations_from_unreachable_code(compressor, self.body, body);
            return make_node(AST_BlockStatement, self, {
                body: body
            });
        }
        if (first instanceof AST_If) {
            var ab = first_statement(first.body);
            if (ab instanceof AST_Break && !external_target(ab)) {
                if (self.condition) {
                    self.condition = make_node(AST_Binary, self.condition, {
                        left: self.condition,
                        operator: "&&",
                        right: first.condition.negate(compressor),
                    });
                } else {
                    self.condition = first.condition.negate(compressor);
                }
                var body = as_statement_array(first.alternative);
                extract_declarations_from_unreachable_code(compressor, first.body, body);
                return drop_it(body);
            }
            ab = first_statement(first.alternative);
            if (ab instanceof AST_Break && !external_target(ab)) {
                if (self.condition) {
                    self.condition = make_node(AST_Binary, self.condition, {
                        left: self.condition,
                        operator: "&&",
                        right: first.condition,
                    });
                } else {
                    self.condition = first.condition;
                }
                var body = as_statement_array(first.body);
                extract_declarations_from_unreachable_code(compressor, first.alternative, body);
                return drop_it(body);
            }
        }
        return self;

        function first_statement(body) {
            return body instanceof AST_BlockStatement ? body.body[0] : body;
        }

        function external_target(node) {
            return compressor.loopcontrol_target(node) !== compressor.self();
        }

        function drop_it(rest) {
            if (self.body instanceof AST_BlockStatement) {
                self.body = self.body.clone();
                self.body.body = rest.concat(self.body.body.slice(1));
                self.body = self.body.transform(compressor);
            } else {
                self.body = make_node(AST_BlockStatement, self.body, {
                    body: rest
                }).transform(compressor);
            }
            return if_break_in_loop(self, compressor);
        }
    }

    OPT(AST_For, function(self, compressor) {
        if (!compressor.option("loops")) return self;
        if (compressor.option("side_effects")) {
            if (self.init) self.init = self.init.drop_side_effect_free(compressor);
            if (self.step) self.step = self.step.drop_side_effect_free(compressor);
        }
        if (self.condition) {
            var cond = fuzzy_eval(compressor, self.condition);
            if (!cond) {
                if (compressor.option("dead_code")) {
                    var body = [];
                    if (is_statement(self.init)) {
                        body.push(self.init);
                    } else if (self.init) {
                        body.push(make_node(AST_SimpleStatement, self.init, { body: self.init }));
                    }
                    body.push(make_node(AST_SimpleStatement, self.condition, { body: self.condition }));
                    extract_declarations_from_unreachable_code(compressor, self.body, body);
                    return make_node(AST_BlockStatement, self, { body: body }).optimize(compressor);
                }
            } else if (!(cond instanceof AST_Node)) {
                self.body = make_node(AST_BlockStatement, self.body, {
                    body: [
                        make_node(AST_SimpleStatement, self.condition, { body: self.condition }),
                        self.body,
                    ],
                });
                self.condition = null;
            }
        }
        return if_break_in_loop(self, compressor);
    });

    OPT(AST_ForEnumeration, function(self, compressor) {
        if (compressor.option("varify") && is_lexical_definition(self.init)) {
            var name = self.init.definitions[0].name;
            if ((name instanceof AST_Destructured || name instanceof AST_SymbolLet)
                && !name.match_symbol(function(node) {
                    if (node instanceof AST_SymbolDeclaration) {
                        var def = node.definition();
                        return !same_scope(def) || may_overlap(compressor, def);
                    }
                }, true)) {
                self.init = to_var(self.init);
            }
        }
        return self;
    });

    function mark_locally_defined(condition, consequent, alternative) {
        if (!(condition instanceof AST_Binary)) return;
        if (!(condition.left instanceof AST_String)) {
            switch (condition.operator) {
              case "&&":
                mark_locally_defined(condition.left, consequent);
                mark_locally_defined(condition.right, consequent);
                break;
              case "||":
                mark_locally_defined(negate(condition.left), alternative);
                mark_locally_defined(negate(condition.right), alternative);
                break;
            }
            return;
        }
        if (!(condition.right instanceof AST_UnaryPrefix)) return;
        if (condition.right.operator != "typeof") return;
        var sym = condition.right.expression;
        if (!is_undeclared_ref(sym)) return;
        var body;
        var undef = condition.left.value == "undefined";
        switch (condition.operator) {
          case "==":
            body = undef ? alternative : consequent;
            break;
          case "!=":
            body = undef ? consequent : alternative;
            break;
          default:
            return;
        }
        if (!body) return;
        var def = sym.definition();
        var tw = new TreeWalker(function(node) {
            if (node instanceof AST_Scope) {
                var parent = tw.parent();
                if (parent instanceof AST_Call && parent.expression === node) return;
                return true;
            }
            if (node instanceof AST_SymbolRef && node.definition() === def) node.defined = true;
        });
        body.walk(tw);

        function negate(node) {
            if (!(node instanceof AST_Binary)) return;
            switch (node.operator) {
              case "==":
                node = node.clone();
                node.operator = "!=";
                return node;
              case "!=":
                node = node.clone();
                node.operator = "==";
                return node;
            }
        }
    }

    function fuzzy_eval(compressor, node, nullish) {
        if (node.truthy) return true;
        if (node.falsy && !nullish) return false;
        if (node.is_truthy()) return true;
        return node.evaluate(compressor, true);
    }

    function mark_duplicate_condition(compressor, node) {
        var child;
        var level = 0;
        var negated = false;
        var parent = compressor.self();
        if (!is_statement(parent)) while (true) {
            child = parent;
            parent = compressor.parent(level++);
            if (parent instanceof AST_Binary) {
                var op = parent.operator;
                if (!lazy_op[op]) return;
                var left = parent.left;
                if (left === child) continue;
                if (match(left)) switch (op) {
                  case "&&":
                    node[negated ? "falsy" : "truthy"] = true;
                    break;
                  case "||":
                  case "??":
                    node[negated ? "truthy" : "falsy"] = true;
                    break;
                }
            } else if (parent instanceof AST_Conditional) {
                var cond = parent.condition;
                if (cond === child) continue;
                if (match(cond)) switch (child) {
                  case parent.consequent:
                    node[negated ? "falsy" : "truthy"] = true;
                    break;
                  case parent.alternative:
                    node[negated ? "truthy" : "falsy"] = true;
                    break;
                }
            } else if (parent instanceof AST_Exit) {
                break;
            } else if (parent instanceof AST_If) {
                break;
            } else if (parent instanceof AST_Sequence) {
                if (parent.expressions[0] === child) continue;
            } else if (parent instanceof AST_SimpleStatement) {
                break;
            }
            return;
        }
        while (true) {
            child = parent;
            parent = compressor.parent(level++);
            if (parent instanceof AST_BlockStatement) {
                if (parent.body[0] === child) continue;
            } else if (parent instanceof AST_If) {
                if (match(parent.condition)) switch (child) {
                  case parent.body:
                    node[negated ? "falsy" : "truthy"] = true;
                    break;
                  case parent.alternative:
                    node[negated ? "truthy" : "falsy"] = true;
                    break;
                }
            }
            return;
        }

        function match(cond) {
            if (node.equivalent_to(cond)) return true;
            if (!(cond instanceof AST_UnaryPrefix)) return false;
            if (cond.operator != "!") return false;
            if (!node.equivalent_to(cond.expression)) return false;
            negated = true;
            return true;
        }
    }

    OPT(AST_If, function(self, compressor) {
        if (is_empty(self.alternative)) self.alternative = null;

        if (!compressor.option("conditionals")) return self;
        if (compressor.option("booleans") && !self.condition.has_side_effects(compressor)) {
            mark_duplicate_condition(compressor, self.condition);
        }
        // if condition can be statically determined, warn and drop
        // one of the blocks.  note, statically determined implies
        // “has no side effects”; also it doesn't work for cases like
        // `x && true`, though it probably should.
        if (compressor.option("dead_code")) {
            var cond = fuzzy_eval(compressor, self.condition);
            if (!cond) {
                AST_Node.warn("Condition always false [{file}:{line},{col}]", self.condition.start);
                var body = [ make_node(AST_SimpleStatement, self.condition, { body: self.condition }) ];
                extract_declarations_from_unreachable_code(compressor, self.body, body);
                if (self.alternative) body.push(self.alternative);
                return make_node(AST_BlockStatement, self, { body: body }).optimize(compressor);
            } else if (!(cond instanceof AST_Node)) {
                AST_Node.warn("Condition always true [{file}:{line},{col}]", self.condition.start);
                var body = [
                    make_node(AST_SimpleStatement, self.condition, { body: self.condition }),
                    self.body,
                ];
                if (self.alternative) extract_declarations_from_unreachable_code(compressor, self.alternative, body);
                return make_node(AST_BlockStatement, self, { body: body }).optimize(compressor);
            }
        }
        var negated = self.condition.negate(compressor);
        var self_condition_length = self.condition.print_to_string().length;
        var negated_length = negated.print_to_string().length;
        var negated_is_best = negated_length < self_condition_length;
        if (self.alternative && negated_is_best) {
            negated_is_best = false; // because we already do the switch here.
            // no need to swap values of self_condition_length and negated_length
            // here because they are only used in an equality comparison later on.
            self.condition = negated;
            var tmp = self.body;
            self.body = self.alternative || make_node(AST_EmptyStatement, self);
            self.alternative = tmp;
        }
        var body = [], var_defs = [], refs = [];
        var body_exprs = sequencesize(self.body, body, var_defs, refs);
        var alt_exprs = sequencesize(self.alternative, body, var_defs, refs);
        if (body_exprs && alt_exprs) {
            if (var_defs.length > 0) body.push(make_node(AST_Var, self, { definitions: var_defs }));
            if (body_exprs.length == 0) {
                body.push(make_node(AST_SimpleStatement, self.condition, {
                    body: alt_exprs.length > 0 ? make_node(AST_Binary, self, {
                        operator : "||",
                        left     : self.condition,
                        right    : make_sequence(self.alternative, alt_exprs)
                    }).transform(compressor) : self.condition.clone()
                }).optimize(compressor));
            } else if (alt_exprs.length == 0) {
                if (self_condition_length === negated_length && !negated_is_best
                    && self.condition instanceof AST_Binary && self.condition.operator == "||") {
                    // although the code length of self.condition and negated are the same,
                    // negated does not require additional surrounding parentheses.
                    // see https://github.com/mishoo/UglifyJS/issues/979
                    negated_is_best = true;
                }
                body.push(make_node(AST_SimpleStatement, self, {
                    body: make_node(AST_Binary, self, {
                        operator : negated_is_best ? "||" : "&&",
                        left     : negated_is_best ? negated : self.condition,
                        right    : make_sequence(self.body, body_exprs)
                    }).transform(compressor)
                }).optimize(compressor));
            } else {
                body.push(make_node(AST_SimpleStatement, self, {
                    body: make_node(AST_Conditional, self, {
                        condition   : self.condition,
                        consequent  : make_sequence(self.body, body_exprs),
                        alternative : make_sequence(self.alternative, alt_exprs)
                    })
                }).optimize(compressor));
            }
            refs.forEach(function(ref) {
                ref.definition().references.push(ref);
            });
            return make_node(AST_BlockStatement, self, {
                body: body
            }).optimize(compressor);
        }
        if (is_empty(self.body)) {
            self = make_node(AST_If, self, {
                condition: negated,
                body: self.alternative,
                alternative: null
            });
        }
        if (self.body instanceof AST_Exit
            && self.alternative instanceof AST_Exit
            && self.body.TYPE == self.alternative.TYPE) {
            var exit = make_node(self.body.CTOR, self, {
                value: make_node(AST_Conditional, self, {
                    condition   : self.condition,
                    consequent  : self.body.value || make_node(AST_Undefined, self.body).transform(compressor),
                    alternative : self.alternative.value || make_node(AST_Undefined, self.alternative).transform(compressor)
                })
            });
            if (exit instanceof AST_Return) {
                exit.in_bool = self.body.in_bool || self.alternative.in_bool;
            }
            return exit;
        }
        if (self.body instanceof AST_If
            && !self.body.alternative
            && !self.alternative) {
            self = make_node(AST_If, self, {
                condition: make_node(AST_Binary, self.condition, {
                    operator: "&&",
                    left: self.condition,
                    right: self.body.condition
                }),
                body: self.body.body,
                alternative: null
            });
        }
        if (aborts(self.body)) {
            if (self.alternative) {
                var alt = self.alternative;
                self.alternative = null;
                return make_node(AST_BlockStatement, self, {
                    body: [ self, alt ]
                }).optimize(compressor);
            }
        }
        if (aborts(self.alternative)) {
            var body = self.body;
            self.body = self.alternative;
            self.condition = negated_is_best ? negated : self.condition.negate(compressor);
            self.alternative = null;
            return make_node(AST_BlockStatement, self, {
                body: [ self, body ]
            }).optimize(compressor);
        }
        if (compressor.option("typeofs")) mark_locally_defined(self.condition, self.body, self.alternative);
        return self;

        function sequencesize(stat, defuns, var_defs, refs) {
            if (stat == null) return [];
            if (stat instanceof AST_BlockStatement) {
                var exprs = [];
                for (var i = 0; i < stat.body.length; i++) {
                    var line = stat.body[i];
                    if (line instanceof AST_LambdaDefinition) {
                        defuns.push(line);
                    } else if (line instanceof AST_EmptyStatement) {
                        continue;
                    } else if (line instanceof AST_SimpleStatement) {
                        if (!compressor.option("sequences") && exprs.length > 0) return;
                        exprs.push(line.body);
                    } else if (line instanceof AST_Var) {
                        if (!compressor.option("sequences") && exprs.length > 0) return;
                        line.remove_initializers(compressor, var_defs);
                        line.definitions.forEach(process_var_def);
                    } else {
                        return;
                    }
                }
                return exprs;
            }
            if (stat instanceof AST_LambdaDefinition) {
                defuns.push(stat);
                return [];
            }
            if (stat instanceof AST_EmptyStatement) return [];
            if (stat instanceof AST_SimpleStatement) return [ stat.body ];
            if (stat instanceof AST_Var) {
                var exprs = [];
                stat.remove_initializers(compressor, var_defs);
                stat.definitions.forEach(process_var_def);
                return exprs;
            }

            function process_var_def(var_def) {
                if (!var_def.value) return;
                exprs.push(make_node(AST_Assign, var_def, {
                    operator: "=",
                    left: var_def.name.convert_symbol(AST_SymbolRef, function(ref) {
                        refs.push(ref);
                    }),
                    right: var_def.value
                }));
            }
        }
    });

    OPT(AST_Switch, function(self, compressor) {
        if (!compressor.option("switches")) return self;
        if (!compressor.option("dead_code")) return self;
        var body = [];
        var branch;
        var decl = [];
        var default_branch;
        var exact_match;
        var side_effects = [];
        for (var i = 0, len = self.body.length; i < len; i++) {
            branch = self.body[i];
            if (branch instanceof AST_Default) {
                var prev = body[body.length - 1];
                if (default_branch || is_break(branch.body[0], compressor) && (!prev || aborts(prev))) {
                    eliminate_branch(branch, prev);
                    continue;
                } else {
                    default_branch = branch;
                }
            } else {
                var exp = branch.expression;
                var equals = make_node(AST_Binary, self, {
                    operator: "===",
                    left: self.expression,
                    right: exp,
                }).evaluate(compressor, true);
                if (!equals) {
                    if (exp.has_side_effects(compressor)) side_effects.push(exp);
                    eliminate_branch(branch, body[body.length - 1]);
                    continue;
                }
                if (!(equals instanceof AST_Node)) {
                    if (default_branch) {
                        var default_index = body.indexOf(default_branch);
                        body.splice(default_index, 1);
                        eliminate_branch(default_branch, body[default_index - 1]);
                        default_branch = null;
                    }
                    if (exp.has_side_effects(compressor)) {
                        exact_match = branch;
                    } else {
                        default_branch = branch = make_node(AST_Default, branch, branch);
                    }
                    while (++i < len) eliminate_branch(self.body[i], branch);
                }
            }
            if (i + 1 >= len || aborts(branch)) {
                var prev = body[body.length - 1];
                var statements = branch.body;
                if (aborts(prev)) switch (prev.body.length - statements.length) {
                  case 1:
                    var stat = prev.body[prev.body.length - 1];
                    if (!is_break(stat, compressor)) break;
                    statements = statements.concat(stat);
                  case 0:
                    var prev_block = make_node(AST_BlockStatement, prev, prev);
                    var next_block = make_node(AST_BlockStatement, branch, { body: statements });
                    if (prev_block.equivalent_to(next_block)) prev.body = [];
                }
            }
            if (side_effects.length) {
                if (branch instanceof AST_Default) {
                    body.push(make_node(AST_Case, self, { expression: make_sequence(self, side_effects), body: [] }));
                } else {
                    side_effects.push(branch.expression);
                    branch.expression = make_sequence(self, side_effects);
                }
                side_effects = [];
            }
            body.push(branch);
        }
        if (side_effects.length && !exact_match) {
            body.push(make_node(AST_Case, self, { expression: make_sequence(self, side_effects), body: [] }));
        }
        while (branch = body[body.length - 1]) {
            var stat = branch.body[branch.body.length - 1];
            if (is_break(stat, compressor)) branch.body.pop();
            if (branch === default_branch) {
                if (!has_declarations_only(branch)) break;
            } else if (branch.expression.has_side_effects(compressor)) {
                break;
            } else if (default_branch) {
                if (!has_declarations_only(default_branch)) break;
                if (body[body.length - 2] !== default_branch) break;
                default_branch.body = default_branch.body.concat(branch.body);
                branch.body = [];
            } else if (!has_declarations_only(branch)) break;
            eliminate_branch(branch);
            if (body.pop() === default_branch) default_branch = null;
        }
        if (!branch) {
            decl.push(make_node(AST_SimpleStatement, self.expression, { body: self.expression }));
            if (side_effects.length) decl.push(make_node(AST_SimpleStatement, self, {
                body: make_sequence(self, side_effects),
            }));
            return make_node(AST_BlockStatement, self, { body: decl }).optimize(compressor);
        }
        if (branch === default_branch) while (branch = body[body.length - 2]) {
            if (branch instanceof AST_Default) break;
            if (!has_declarations_only(branch)) break;
            var exp = branch.expression;
            if (exp.has_side_effects(compressor)) {
                var prev = body[body.length - 3];
                if (prev && !aborts(prev)) break;
                default_branch.body.unshift(make_node(AST_SimpleStatement, self, { body: exp }));
            }
            eliminate_branch(branch);
            body.splice(-2, 1);
        }
        body[0].body = decl.concat(body[0].body);
        self.body = body;
        if (compressor.option("conditionals")) switch (body.length) {
          case 1:
            if (!no_break(body[0])) break;
            var exp = body[0].expression;
            var statements = body[0].body.slice();
            if (body[0] !== default_branch && body[0] !== exact_match) return make_node(AST_If, self, {
                condition: make_node(AST_Binary, self, {
                    operator: "===",
                    left: self.expression,
                    right: exp,
                }),
                body: make_node(AST_BlockStatement, self, {
                    body: statements,
                }),
                alternative: null,
            }).optimize(compressor);
            if (exp) statements.unshift(make_node(AST_SimpleStatement, exp, {
                body: exp,
            }));
            statements.unshift(make_node(AST_SimpleStatement, self.expression, {
                body:self.expression,
            }));
            return make_node(AST_BlockStatement, self, {
                body: statements,
            }).optimize(compressor);
          case 2:
            if (!member(default_branch, body) || !no_break(body[1])) break;
            var statements = body[0].body.slice();
            var exclusive = statements.length && is_break(statements[statements.length - 1], compressor);
            if (exclusive) statements.pop();
            if (!all(statements, no_break)) break;
            var alternative = body[1].body.length && make_node(AST_BlockStatement, body[1], body[1]);
            var node = make_node(AST_If, self, {
                condition: make_node(AST_Binary, self, body[0] === default_branch ? {
                    operator: "!==",
                    left: self.expression,
                    right: body[1].expression,
                } : {
                    operator: "===",
                    left: self.expression,
                    right: body[0].expression,
                }),
                body: make_node(AST_BlockStatement, body[0], {
                    body: statements,
                }),
                alternative: exclusive && alternative || null,
            });
            if (!exclusive && alternative) node = make_node(AST_BlockStatement, self, {
                body: [ node, alternative ],
            });
            return node.optimize(compressor);
        }
        return self;

        function is_break(node, tw) {
            return node instanceof AST_Break && tw.loopcontrol_target(node) === self;
        }

        function no_break(node) {
            var found = false;
            var tw = new TreeWalker(function(node) {
                if (found
                    || node instanceof AST_Lambda
                    || node instanceof AST_SimpleStatement) return true;
                if (is_break(node, tw)) found = true;
            });
            tw.push(self);
            node.walk(tw);
            return !found;
        }

        function eliminate_branch(branch, prev) {
            if (prev && !aborts(prev)) {
                prev.body = prev.body.concat(branch.body);
            } else {
                extract_declarations_from_unreachable_code(compressor, branch, decl);
            }
        }
    });

    OPT(AST_Try, function(self, compressor) {
        self.body = tighten_body(self.body, compressor);
        if (compressor.option("dead_code")) {
            if (has_declarations_only(self)
                && !(self.bcatch && self.bcatch.argname && self.bcatch.argname.match_symbol(function(node) {
                    return node instanceof AST_SymbolCatch && !can_drop_symbol(node);
                }, true))) {
                var body = [];
                if (self.bcatch) {
                    extract_declarations_from_unreachable_code(compressor, self.bcatch, body);
                    body.forEach(function(stat) {
                        if (!(stat instanceof AST_Var)) return;
                        stat.definitions.forEach(function(var_def) {
                            var def = var_def.name.definition().redefined();
                            if (!def) return;
                            var_def.name = var_def.name.clone();
                            var_def.name.thedef = def;
                        });
                    });
                }
                body.unshift(make_node(AST_BlockStatement, self, self).optimize(compressor));
                if (self.bfinally) {
                    body.push(make_node(AST_BlockStatement, self.bfinally, self.bfinally).optimize(compressor));
                }
                return make_node(AST_BlockStatement, self, {
                    body: body
                }).optimize(compressor);
            }
            if (self.bfinally && has_declarations_only(self.bfinally)) {
                var body = make_node(AST_BlockStatement, self.bfinally, self.bfinally).optimize(compressor);
                body = self.body.concat(body);
                if (!self.bcatch) return make_node(AST_BlockStatement, self, {
                    body: body
                }).optimize(compressor);
                self.body = body;
                self.bfinally = null;
            }
        }
        return self;
    });

    function remove_initializers(make_value) {
        return function(compressor, defns) {
            var dropped = false;
            this.definitions.forEach(function(defn) {
                if (defn.value) dropped = true;
                defn.name.match_symbol(function(node) {
                    if (node instanceof AST_SymbolDeclaration) defns.push(make_node(AST_VarDef, node, {
                        name: node,
                        value: make_value(compressor, node)
                    }));
                }, true);
            });
            return dropped;
        };
    }

    AST_Const.DEFMETHOD("remove_initializers", remove_initializers(function(compressor, node) {
        return make_node(AST_Undefined, node).optimize(compressor);
    }));
    AST_Let.DEFMETHOD("remove_initializers", remove_initializers(return_null));
    AST_Var.DEFMETHOD("remove_initializers", remove_initializers(return_null));

    AST_Definitions.DEFMETHOD("to_assignments", function() {
        var assignments = this.definitions.reduce(function(a, defn) {
            var def = defn.name.definition();
            var value = defn.value;
            if (value) {
                if (value instanceof AST_Sequence) value = value.clone();
                var name = make_node(AST_SymbolRef, defn.name, defn.name);
                var assign = make_node(AST_Assign, defn, {
                    operator: "=",
                    left: name,
                    right: value,
                });
                a.push(assign);
                name.fixed = function() {
                    return assign.right;
                };
                name.fixed.assigns = [ assign ];
                def.references.forEach(function(ref) {
                    var assigns = ref.fixed && ref.fixed.assigns;
                    if (assigns && assigns[0] === defn) assigns[0] = assign;
                });
                def.references.push(name);
            }
            def.eliminated++;
            def.single_use = false;
            return a;
        }, []);
        if (assignments.length == 0) return null;
        return make_sequence(this, assignments);
    });

    function is_safe_lexical(def) {
        return def.name != "arguments" && def.orig.length < (def.orig[0] instanceof AST_SymbolLambda ? 3 : 2);
    }

    function may_overlap(compressor, def) {
        if (compressor.exposed(def)) return true;
        var scope = def.scope.resolve();
        for (var s = def.scope; s !== scope;) {
            s = s.parent_scope;
            if (s.var_names()[def.name]) return true;
        }
    }

    function to_var(stat) {
        return make_node(AST_Var, stat, {
            definitions: stat.definitions.map(function(defn) {
                return make_node(AST_VarDef, defn, {
                    name: defn.name.convert_symbol(AST_SymbolVar, function(name, node) {
                        var def = name.definition();
                        def.orig[def.orig.indexOf(node)] = name;
                        var scope = def.scope.resolve();
                        if (def.scope === scope) return;
                        def.scope = scope;
                        scope.variables.set(def.name, def);
                        scope.enclosed.push(def);
                        scope.var_names()[def.name] = true;
                    }),
                    value: defn.value,
                });
            })
        });
    }

    function can_varify(compressor, sym) {
        if (!sym.fixed_value()) return false;
        var def = sym.definition();
        return is_safe_lexical(def) && same_scope(def) && !may_overlap(compressor, def);
    }

    function varify(self, compressor) {
        return compressor.option("varify") && all(self.definitions, function(defn) {
            return !defn.name.match_symbol(function(node) {
                if (node instanceof AST_SymbolDeclaration) return !can_varify(compressor, node);
            }, true);
        }) ? to_var(self) : self;
    }

    OPT(AST_Const, varify);
    OPT(AST_Let, varify);

    function trim_optional_chain(self, compressor) {
        if (!compressor.option("optional_chains")) return;
        if (!self.optional) return;
        var expr = self.expression;
        var ev = fuzzy_eval(compressor, expr, true);
        if (ev == null) return make_node(AST_UnaryPrefix, self, {
            operator: "void",
            expression: expr,
        }).optimize(compressor);
        if (!(ev instanceof AST_Node)) self.optional = false;
    }

    function lift_sequence_in_expression(node, compressor) {
        var exp = node.expression;
        if (!(exp instanceof AST_Sequence)) return node;
        var x = exp.expressions.slice();
        var e = node.clone();
        e.expression = x.pop();
        x.push(e);
        return make_sequence(node, x);
    }

    function drop_unused_call_args(call, compressor, fns_with_marked_args) {
        var exp = call.expression;
        var fn = exp instanceof AST_SymbolRef ? exp.fixed_value() : exp;
        if (!(fn instanceof AST_Lambda)) return;
        if (fn.uses_arguments) return;
        if (fn.pinned()) return;
        if (fns_with_marked_args && fns_with_marked_args.indexOf(fn) < 0) return;
        var args = call.args;
        if (!all(args, function(arg) {
            return !(arg instanceof AST_Spread);
        })) return;
        var argnames = fn.argnames;
        var is_iife = fn === exp && !fn.name;
        if (fn.rest) {
            if (!(is_iife && compressor.option("rests"))) return;
            var insert = argnames.length;
            args = args.slice(0, insert);
            while (args.length < insert) args.push(make_node(AST_Undefined, call).optimize(compressor));
            args.push(make_node(AST_Array, call, { elements: call.args.slice(insert) }));
            argnames = argnames.concat(fn.rest);
            fn.rest = null;
        } else {
            args = args.slice();
            argnames = argnames.slice();
        }
        var pos = 0, last = 0;
        var drop_defaults = is_iife && compressor.option("default_values");
        var drop_fargs = is_iife && compressor.drop_fargs(fn, call) ? function(argname, arg) {
            if (!argname) return true;
            if (argname instanceof AST_DestructuredArray) {
                return argname.elements.length == 0 && !argname.rest && arg instanceof AST_Array;
            }
            if (argname instanceof AST_DestructuredObject) {
                return argname.properties.length == 0 && !argname.rest && arg && !arg.may_throw_on_access(compressor);
            }
            return argname.__unused;
        } : return_false;
        var side_effects = [];
        for (var i = 0; i < args.length; i++) {
            var argname = argnames[i];
            if (drop_defaults && argname instanceof AST_DefaultValue && args[i].is_defined(compressor)) {
                argnames[i] = argname = argname.name;
            }
            if (!argname || "__unused" in argname) {
                var node = args[i].drop_side_effect_free(compressor);
                if (drop_fargs(argname)) {
                    if (argname) argnames.splice(i, 1);
                    args.splice(i, 1);
                    if (node) side_effects.push(node);
                    i--;
                    continue;
                } else if (node) {
                    side_effects.push(node);
                    args[pos++] = make_sequence(call, side_effects);
                    side_effects = [];
                } else if (argname) {
                    if (side_effects.length) {
                        args[pos++] = make_sequence(call, side_effects);
                        side_effects = [];
                    } else {
                        args[pos++] = make_node(AST_Number, args[i], {
                            value: 0
                        });
                        continue;
                    }
                }
            } else if (drop_fargs(argname, args[i])) {
                var node = args[i].drop_side_effect_free(compressor);
                argnames.splice(i, 1);
                args.splice(i, 1);
                if (node) side_effects.push(node);
                i--;
                continue;
            } else {
                side_effects.push(args[i]);
                args[pos++] = make_sequence(call, side_effects);
                side_effects = [];
            }
            last = pos;
        }
        for (; i < argnames.length; i++) {
            if (drop_fargs(argnames[i])) argnames.splice(i--, 1);
        }
        fn.argnames = argnames;
        args.length = last;
        call.args = args;
        if (!side_effects.length) return;
        var arg = make_sequence(call, side_effects);
        args.push(args.length < argnames.length ? make_node(AST_UnaryPrefix, call, {
            operator: "void",
            expression: arg,
        }) : arg);
    }

    OPT(AST_Call, function(self, compressor) {
        var exp = self.expression;
        var terminated = trim_optional_chain(self, compressor);
        if (terminated) return terminated;
        if (compressor.option("sequences")) {
            if (exp instanceof AST_PropAccess) {
                var seq = lift_sequence_in_expression(exp, compressor);
                if (seq !== exp) {
                    var call = self.clone();
                    call.expression = seq.expressions.pop();
                    seq.expressions.push(call);
                    return seq.optimize(compressor);
                }
            } else if (!needs_unbinding(compressor, exp.tail_node())) {
                var seq = lift_sequence_in_expression(self, compressor);
                if (seq !== self) return seq.optimize(compressor);
            }
        }
        if (compressor.option("unused")) drop_unused_call_args(self, compressor);
        if (compressor.option("unsafe")) {
            if (is_undeclared_ref(exp)) switch (exp.name) {
              case "Array":
                // Array(n) ---> [ , , ... , ]
                if (self.args.length == 1) {
                    var first = self.args[0];
                    if (first instanceof AST_Number) try {
                        var length = first.value;
                        if (length > 6) break;
                        var elements = Array(length);
                        for (var i = 0; i < length; i++) elements[i] = make_node(AST_Hole, self);
                        return make_node(AST_Array, self, { elements: elements });
                    } catch (ex) {
                        AST_Node.warn("Invalid array length: {length} [{file}:{line},{col}]", {
                            length: length,
                            file: self.start.file,
                            line: self.start.line,
                            col: self.start.col,
                        });
                        break;
                    }
                    if (!first.is_boolean(compressor) && !first.is_string(compressor)) break;
                }
                // Array(...) ---> [ ... ]
                return make_node(AST_Array, self, { elements: self.args });
              case "Object":
                // Object() ---> {}
                if (self.args.length == 0) return make_node(AST_Object, self, { properties: [] });
                break;
              case "String":
                // String() ---> ""
                if (self.args.length == 0) return make_node(AST_String, self, { value: "" });
                // String(x) ---> "" + x
                if (self.args.length == 1) return make_node(AST_Binary, self, {
                    operator: "+",
                    left: make_node(AST_String, self, { value: "" }),
                    right: self.args[0],
                }).optimize(compressor);
                break;
              case "Number":
                // Number() ---> 0
                if (self.args.length == 0) return make_node(AST_Number, self, { value: 0 });
                // Number(x) ---> +("" + x)
                if (self.args.length == 1) return make_node(AST_UnaryPrefix, self, {
                    operator: "+",
                    expression: make_node(AST_Binary, self, {
                        operator: "+",
                        left: make_node(AST_String, self, { value: "" }),
                        right: self.args[0],
                    }),
                }).optimize(compressor);
                break;
              case "Boolean":
                // Boolean() ---> false
                if (self.args.length == 0) return make_node(AST_False, self).optimize(compressor);
                // Boolean(x) ---> !!x
                if (self.args.length == 1) return make_node(AST_UnaryPrefix, self, {
                    operator: "!",
                    expression: make_node(AST_UnaryPrefix, self, {
                        operator: "!",
                        expression: self.args[0],
                    }),
                }).optimize(compressor);
                break;
              case "RegExp":
                // attempt to convert RegExp(...) to literal
                var params = [];
                if (all(self.args, function(arg) {
                    var value = arg.evaluate(compressor);
                    params.unshift(value);
                    return arg !== value;
                })) try {
                    return best_of(compressor, self, make_node(AST_RegExp, self, {
                        value: RegExp.apply(RegExp, params),
                    }));
                } catch (ex) {
                    AST_Node.warn("Error converting {expr} [{file}:{line},{col}]", {
                        expr: self,
                        file: self.start.file,
                        line: self.start.line,
                        col: self.start.col,
                    });
                }
                break;
            } else if (exp instanceof AST_Dot) switch (exp.property) {
              case "toString":
                // x.toString() ---> "" + x
                var expr = exp.expression;
                if (self.args.length == 0 && !(expr.may_throw_on_access(compressor) || expr instanceof AST_Super)) {
                    return make_node(AST_Binary, self, {
                        operator: "+",
                        left: make_node(AST_String, self, { value: "" }),
                        right: expr,
                    }).optimize(compressor);
                }
                break;
              case "join":
                if (exp.expression instanceof AST_Array && self.args.length < 2) EXIT: {
                    var separator = self.args[0];
                    // [].join() ---> ""
                    // [].join(x) ---> (x, "")
                    if (exp.expression.elements.length == 0 && !(separator instanceof AST_Spread)) {
                        return separator ? make_sequence(self, [
                            separator,
                            make_node(AST_String, self, { value: "" }),
                        ]).optimize(compressor) : make_node(AST_String, self, { value: "" });
                    }
                    if (separator) {
                        separator = separator.evaluate(compressor);
                        if (separator instanceof AST_Node) break EXIT; // not a constant
                    }
                    var elements = [];
                    var consts = [];
                    for (var i = 0; i < exp.expression.elements.length; i++) {
                        var el = exp.expression.elements[i];
                        var value = el.evaluate(compressor);
                        if (value !== el) {
                            consts.push(value);
                        } else if (el instanceof AST_Spread) {
                            break EXIT;
                        } else {
                            if (consts.length > 0) {
                                elements.push(make_node(AST_String, self, {
                                    value: consts.join(separator),
                                }));
                                consts.length = 0;
                            }
                            elements.push(el);
                        }
                    }
                    if (consts.length > 0) elements.push(make_node(AST_String, self, {
                        value: consts.join(separator),
                    }));
                    // [ x ].join() ---> "" + x
                    // [ x ].join(".") ---> "" + x
                    // [ 1, 2, 3 ].join() ---> "1,2,3"
                    // [ 1, 2, 3 ].join(".") ---> "1.2.3"
                    if (elements.length == 1) {
                        if (elements[0].is_string(compressor)) return elements[0];
                        return make_node(AST_Binary, elements[0], {
                            operator: "+",
                            left: make_node(AST_String, self, { value: "" }),
                            right: elements[0],
                        });
                    }
                    // [ 1, 2, a, 3 ].join("") ---> "12" + a + "3"
                    if (separator == "") {
                        var first;
                        if (elements[0].is_string(compressor) || elements[1].is_string(compressor)) {
                            first = elements.shift();
                        } else {
                            first = make_node(AST_String, self, { value: "" });
                        }
                        return elements.reduce(function(prev, el) {
                            return make_node(AST_Binary, el, {
                                operator: "+",
                                left: prev,
                                right: el,
                            });
                        }, first).optimize(compressor);
                    }
                    // [ x, "foo", "bar", y ].join() ---> [ x, "foo,bar", y ].join()
                    // [ x, "foo", "bar", y ].join("-") ---> [ x, "foo-bar", y ].join("-")
                    // need this awkward cloning to not affect original element
                    // best_of will decide which one to get through.
                    var node = self.clone();
                    node.expression = node.expression.clone();
                    node.expression.expression = node.expression.expression.clone();
                    node.expression.expression.elements = elements;
                    return best_of(compressor, self, node);
                }
                break;
              case "charAt":
                if (self.args.length < 2) {
                    var node = make_node(AST_Binary, self, {
                        operator: "||",
                        left: make_node(AST_Sub, self, {
                            expression: exp.expression,
                            property: self.args.length ? make_node(AST_Binary, self.args[0], {
                                operator: "|",
                                left: make_node(AST_Number, self, { value: 0 }),
                                right: self.args[0],
                            }) : make_node(AST_Number, self, { value: 0 }),
                        }).optimize(compressor),
                        right: make_node(AST_String, self, { value: "" }),
                    });
                    node.is_string = return_true;
                    return node.optimize(compressor);
                }
                break;
              case "apply":
                if (self.args.length == 2 && self.args[1] instanceof AST_Array) {
                    var args = self.args[1].elements.slice();
                    args.unshift(self.args[0]);
                    return make_node(AST_Call, self, {
                        expression: make_node(AST_Dot, exp, {
                            expression: exp.expression,
                            property: "call",
                        }),
                        args: args
                    }).optimize(compressor);
                }
                break;
              case "call":
                var func = exp.expression;
                if (func instanceof AST_SymbolRef) {
                    func = func.fixed_value();
                }
                if (func instanceof AST_Lambda && !func.contains_this()) {
                    return (self.args.length ? make_sequence(this, [
                        self.args[0],
                        make_node(AST_Call, self, {
                            expression: exp.expression,
                            args: self.args.slice(1)
                        })
                    ]) : make_node(AST_Call, self, {
                        expression: exp.expression,
                        args: []
                    })).optimize(compressor);
                }
                break;
            }
        }
        if (compressor.option("unsafe_Function")
            && is_undeclared_ref(exp)
            && exp.name == "Function") {
            // new Function() ---> function(){}
            if (self.args.length == 0) return make_node(AST_Function, self, {
                argnames: [],
                body: []
            }).init_vars(exp.scope);
            if (all(self.args, function(x) {
                return x instanceof AST_String;
            })) {
                // quite a corner-case, but we can handle it:
                //   https://github.com/mishoo/UglifyJS/issues/203
                // if the code argument is a constant, then we can minify it.
                try {
                    var code = "n(function(" + self.args.slice(0, -1).map(function(arg) {
                        return arg.value;
                    }).join() + "){" + self.args[self.args.length - 1].value + "})";
                    var ast = parse(code);
                    var mangle = { ie: compressor.option("ie") };
                    ast.figure_out_scope(mangle);
                    var comp = new Compressor(compressor.options);
                    ast = ast.transform(comp);
                    ast.figure_out_scope(mangle);
                    ast.compute_char_frequency(mangle);
                    ast.mangle_names(mangle);
                    var fun;
                    ast.walk(new TreeWalker(function(node) {
                        if (fun) return true;
                        if (node instanceof AST_Lambda) {
                            fun = node;
                            return true;
                        }
                    }));
                    var code = OutputStream();
                    AST_BlockStatement.prototype._codegen.call(fun, code);
                    self.args = [
                        make_node(AST_String, self, {
                            value: fun.argnames.map(function(arg) {
                                return arg.print_to_string();
                            }).join(),
                        }),
                        make_node(AST_String, self.args[self.args.length - 1], {
                            value: code.get().replace(/^\{|\}$/g, "")
                        })
                    ];
                    return self;
                } catch (ex) {
                    if (ex instanceof JS_Parse_Error) {
                        AST_Node.warn("Error parsing code passed to new Function [{file}:{line},{col}]", self.args[self.args.length - 1].start);
                        AST_Node.warn(ex.toString());
                    } else {
                        throw ex;
                    }
                }
            }
        }
        var fn = exp instanceof AST_SymbolRef ? exp.fixed_value() : exp;
        var parent = compressor.parent(), current = compressor.self();
        var is_func = fn instanceof AST_Lambda
            && (!is_async(fn) || compressor.option("awaits") && parent instanceof AST_Await)
            && (!is_generator(fn) || compressor.option("yields") && current instanceof AST_Yield && current.nested);
        var stat = is_func && fn.first_statement();
        var has_default = 0, has_destructured = false;
        var has_spread = !all(self.args, function(arg) {
            return !(arg instanceof AST_Spread);
        });
        var can_drop = is_func && all(fn.argnames, function(argname, index) {
            if (has_default == 1 && self.args[index] instanceof AST_Spread) has_default = 2;
            if (argname instanceof AST_DefaultValue) {
                if (!has_default) has_default = 1;
                var arg = has_default == 1 && self.args[index];
                if (arg && !is_undefined(arg)) has_default = 2;
                if (has_arg_refs(argname.value)) return false;
                argname = argname.name;
            }
            if (argname instanceof AST_Destructured) {
                has_destructured = true;
                if (has_arg_refs(argname)) return false;
            }
            return true;
        }) && !(fn.rest instanceof AST_Destructured && has_arg_refs(fn.rest));
        var can_inline = can_drop && compressor.option("inline") && !self.is_expr_pure(compressor);
        if (can_inline && stat instanceof AST_Return) {
            var value = stat.value;
            if (exp === fn && !fn.name && (!value || value.is_constant_expression()) && safe_from_await_yield(fn)) {
                return make_sequence(self, convert_args(value)).optimize(compressor);
            }
        }
        if (is_func) {
            var def, value, var_assigned = false;
            if (can_inline
                && !fn.uses_arguments
                && !fn.pinned()
                && !(fn.name && fn instanceof AST_LambdaExpression)
                && (exp === fn || !recursive_ref(compressor, def = exp.definition(), fn)
                    && fn.is_constant_expression(find_scope(compressor)))
                && !has_spread
                && (value = can_flatten_body(stat))
                && !fn.contains_this()) {
                var replacing = exp === fn || def.single_use && def.references.length - def.replaced == 1;
                if (can_substitute_directly()) {
                    var args = self.args.slice();
                    var refs = [];
                    args.push(value.clone(true).transform(new TreeTransformer(function(node) {
                        if (node instanceof AST_SymbolRef) {
                            var def = node.definition();
                            if (fn.variables.get(node.name) !== def) {
                                refs.push(node);
                                return node;
                            }
                            var index = resolve_index(def);
                            var arg = args[index];
                            if (!arg) return make_node(AST_Undefined, self);
                            args[index] = null;
                            var parent = this.parent();
                            return parent ? maintain_this_binding(compressor, parent, node, arg) : arg;
                        }
                    })));
                    var save_inlined = fn.inlined;
                    if (exp !== fn) fn.inlined = true;
                    var node = make_sequence(self, args.filter(function(arg) {
                        return arg;
                    })).optimize(compressor);
                    fn.inlined = save_inlined;
                    node = maintain_this_binding(compressor, parent, current, node);
                    if (replacing || best_of_expression(node, self) === node) {
                        refs.forEach(function(ref) {
                            ref.scope = exp === fn ? fn.parent_scope : exp.scope;
                            ref.reference();
                            var def = ref.definition();
                            if (replacing) def.replaced++;
                            def.single_use = false;
                        });
                        return node;
                    } else if (!node.has_side_effects(compressor)) {
                        self.drop_side_effect_free = return_null;
                    }
                }
                var arg_used, insert, in_loop, scope;
                if (replacing && can_inject_symbols()) {
                    fn._squeezed = true;
                    if (exp !== fn) fn.parent_scope = exp.scope;
                    var node = make_sequence(self, flatten_fn()).optimize(compressor);
                    return maintain_this_binding(compressor, parent, current, node);
                }
            }
            if (compressor.option("side_effects")
                && can_drop
                && all(fn.body, is_empty)
                && (fn === exp ? fn_name_unused(fn, compressor) : !has_default && !has_destructured && !fn.rest)
                && !(is_arrow(fn) && fn.value)
                && safe_from_await_yield(fn)) {
                return make_sequence(self, convert_args()).optimize(compressor);
            }
        }
        if (compressor.option("drop_console")) {
            if (exp instanceof AST_PropAccess) {
                var name = exp.expression;
                while (name.expression) {
                    name = name.expression;
                }
                if (is_undeclared_ref(name) && name.name == "console") {
                    return make_node(AST_Undefined, self).optimize(compressor);
                }
            }
        }
        if (compressor.option("negate_iife") && parent instanceof AST_SimpleStatement && is_iife_call(current)) {
            return self.negate(compressor, true);
        }
        return try_evaluate(compressor, self);

        function has_arg_refs(node) {
            var found = false;
            node.walk(new TreeWalker(function(node) {
                if (found) return true;
                if (node instanceof AST_SymbolRef && fn.variables.get(node.name) === node.definition()) {
                    return found = true;
                }
            }));
            return found;
        }

        function make_void_lhs(orig) {
            return make_node(AST_Dot, orig, {
                expression: make_node(AST_Array, orig, { elements: [] }),
                property: "e",
            });
        }

        function convert_args(value) {
            var args = self.args.slice();
            var destructured = has_default > 1 || has_destructured || fn.rest;
            if (destructured || has_spread) args = [ make_node(AST_Array, self, { elements: args }) ];
            if (destructured) {
                var tt = new TreeTransformer(function(node, descend) {
                    if (node instanceof AST_DefaultValue) return make_node(AST_DefaultValue, node, {
                        name: node.name.transform(tt) || make_void_lhs(node),
                        value: node.value,
                    });
                    if (node instanceof AST_DestructuredArray) {
                        var elements = [];
                        node.elements.forEach(function(node, index) {
                            node = node.transform(tt);
                            if (node) elements[index] = node;
                        });
                        fill_holes(node, elements);
                        return make_node(AST_DestructuredArray, node, { elements: elements });
                    }
                    if (node instanceof AST_DestructuredObject) {
                        var properties = [], side_effects = [];
                        node.properties.forEach(function(prop) {
                            var key = prop.key;
                            var value = prop.value.transform(tt);
                            if (value) {
                                if (side_effects.length) {
                                    if (!(key instanceof AST_Node)) key = make_node_from_constant(key, prop);
                                    side_effects.push(key);
                                    key = make_sequence(node, side_effects);
                                    side_effects = [];
                                }
                                properties.push(make_node(AST_DestructuredKeyVal, prop, {
                                    key: key,
                                    value: value,
                                }));
                            } else if (key instanceof AST_Node) {
                                side_effects.push(key);
                            }
                        });
                        if (side_effects.length) properties.push(make_node(AST_DestructuredKeyVal, node, {
                            key: make_sequence(node, side_effects),
                            value: make_void_lhs(node),
                        }));
                        return make_node(AST_DestructuredObject, node, { properties: properties });
                    }
                    if (node instanceof AST_SymbolFunarg) return null;
                });
                var lhs = [];
                fn.argnames.forEach(function(argname, index) {
                    argname = argname.transform(tt);
                    if (argname) lhs[index] = argname;
                });
                var rest = fn.rest && fn.rest.transform(tt);
                if (rest) lhs.length = fn.argnames.length;
                fill_holes(fn, lhs);
                args[0] = make_node(AST_Assign, self, {
                    operator: "=",
                    left: make_node(AST_DestructuredArray, fn, {
                        elements: lhs,
                        rest: rest,
                    }),
                    right: args[0],
                });
            } else fn.argnames.forEach(function(argname) {
                if (argname instanceof AST_DefaultValue) args.push(argname.value);
            });
            args.push(value || make_node(AST_Undefined, self));
            return args;
        }

        function avoid_await_yield() {
            var avoid = [];
            var parent_scope = scope || compressor.find_parent(AST_Scope);
            if (is_async(parent_scope)) avoid.push("await");
            if (is_generator(parent_scope)) avoid.push("yield");
            return avoid.length && makePredicate(avoid);
        }

        function safe_from_await_yield(node) {
            var avoid = avoid_await_yield();
            if (!avoid) return true;
            var safe = true;
            var tw = new TreeWalker(function(node) {
                if (!safe) return true;
                if (node instanceof AST_Scope) {
                    if (node === fn) return;
                    if (is_arrow(node)) {
                        for (var i = 0; safe && i < node.argnames.length; i++) node.argnames[i].walk(tw);
                    } else if (node instanceof AST_LambdaDefinition && avoid[node.name.name]) {
                        safe = false;
                    }
                    return true;
                }
                if (node instanceof AST_Symbol && avoid[node.name] && node !== fn.name) safe = false;
            });
            node.walk(tw);
            return safe;
        }

        function return_value(stat) {
            if (!stat) return make_node(AST_Undefined, self);
            if (stat instanceof AST_Return) return stat.value || make_node(AST_Undefined, self);
            if (stat instanceof AST_SimpleStatement) return make_node(AST_UnaryPrefix, stat, {
                operator: "void",
                expression: stat.body
            });
        }

        function can_flatten_body(stat) {
            var len = fn.body.length;
            if (len < 2) {
                stat = return_value(stat);
                if (stat) return stat;
            }
            if (compressor.option("inline") < 3) return false;
            stat = null;
            for (var i = 0; i < len; i++) {
                var line = fn.body[i];
                if (line instanceof AST_Var) {
                    var assigned = var_assigned || !declarations_only(line);
                    if (assigned) {
                        var_assigned = true;
                        if (stat) return false;
                    }
                } else if (line instanceof AST_AsyncDefun
                    || line instanceof AST_Defun
                    || line instanceof AST_EmptyStatement) {
                    continue;
                } else if (stat) {
                    return false;
                } else {
                    stat = line;
                }
            }
            return return_value(stat);
        }

        function resolve_index(def) {
            for (var i = fn.argnames.length; --i >= 0;) {
                if (fn.argnames[i].definition() === def) return i;
            }
        }

        function can_substitute_directly() {
            if (has_default || has_destructured || var_assigned || fn.rest) return;
            if (compressor.option("inline") < 2 && fn.argnames.length) return;
            if (!fn.variables.all(function(def) {
                return def.references.length - def.replaced < 2 && def.orig[0] instanceof AST_SymbolFunarg;
            })) return;
            var abort = false;
            var avoid = avoid_await_yield();
            var begin;
            var in_order = [];
            var side_effects = false;
            value.walk(new TreeWalker(function(node, descend) {
                if (abort) return true;
                if (node instanceof AST_Binary && lazy_op[node.operator]
                    || node instanceof AST_Conditional) {
                    in_order = null;
                    return;
                }
                if (node instanceof AST_Scope) return abort = true;
                if (avoid && node instanceof AST_Symbol && avoid[node.name]) return abort = true;
                if (node instanceof AST_SymbolRef) {
                    var def = node.definition();
                    if (fn.variables.get(node.name) !== def) {
                        in_order = null;
                        return;
                    }
                    if (def.init instanceof AST_LambdaDefinition) return abort = true;
                    if (is_lhs(node, this.parent())) return abort = true;
                    var index = resolve_index(def);
                    if (!(begin < index)) begin = index;
                    if (!in_order) return;
                    if (side_effects) {
                        in_order = null;
                    } else {
                        in_order.push(fn.argnames[index]);
                    }
                    return;
                }
                if (node.has_side_effects(compressor)) {
                    descend();
                    side_effects = true;
                    return true;
                }
            }));
            if (abort) return;
            var end = self.args.length;
            if (in_order && fn.argnames.length >= end) {
                end = fn.argnames.length;
                while (end-- > begin && fn.argnames[end] === in_order.pop());
                end++;
            }
            var scope = side_effects && !in_order && compressor.find_parent(AST_Scope);
            return end <= begin || all(self.args.slice(begin, end), scope ? function(funarg) {
                return funarg.is_constant_expression(scope);
            } : function(funarg) {
                return !funarg.has_side_effects(compressor);
            });
        }

        function var_exists(defined, name) {
            return defined[name] || identifier_atom[name] || scope.var_names()[name];
        }

        function can_inject_args(defined, used, safe_to_inject) {
            var abort = false;
            fn.each_argname(function(arg) {
                if (abort) return;
                if (arg.__unused) return;
                if (!safe_to_inject || var_exists(defined, arg.name)) return abort = true;
                used[arg.name] = true;
                if (in_loop) in_loop.push(arg.definition());
            });
            return !abort;
        }

        function can_inject_vars(defined, used, safe_to_inject) {
            for (var i = 0; i < fn.body.length; i++) {
                var stat = fn.body[i];
                if (stat instanceof AST_LambdaDefinition) {
                    if (!safe_to_inject || var_exists(used, stat.name.name)) return false;
                    if (!all(stat.enclosed, function(def) {
                        return def.scope === stat || !defined[def.name];
                    })) return false;
                    if (in_loop) in_loop.push(stat.name.definition());
                    continue;
                }
                if (!(stat instanceof AST_Var)) continue;
                if (!safe_to_inject) return false;
                for (var j = stat.definitions.length; --j >= 0;) {
                    var name = stat.definitions[j].name;
                    if (var_exists(defined, name.name)) return false;
                    if (in_loop) in_loop.push(name.definition());
                }
            }
            return true;
        }

        function can_inject_symbols() {
            var defined = Object.create(null);
            var level = 0, child;
            scope = current;
            do {
                if (scope.variables) scope.variables.each(function(def) {
                    defined[def.name] = true;
                });
                child = scope;
                scope = compressor.parent(level++);
                if (scope instanceof AST_DWLoop) {
                    in_loop = [];
                } else if (scope instanceof AST_For) {
                    if (scope.init === child) continue;
                    in_loop = [];
                } else if (scope instanceof AST_ForEnumeration) {
                    if (scope.init === child) continue;
                    if (scope.object === child) continue;
                    in_loop = [];
                } else if (scope instanceof AST_SymbolRef) {
                    if (scope.fixed_value() instanceof AST_Scope) return false;
                }
            } while (!(scope instanceof AST_Scope));
            insert = scope.body.indexOf(child) + 1;
            if (!insert) return false;
            if (!safe_from_await_yield(fn)) return false;
            var safe_to_inject = exp !== fn || fn.parent_scope.resolve() === scope;
            if (scope instanceof AST_Toplevel) {
                if (compressor.toplevel.vars) {
                    defined["arguments"] = true;
                } else {
                    safe_to_inject = false;
                }
            }
            var inline = compressor.option("inline");
            arg_used = Object.create(defined);
            if (!can_inject_args(defined, arg_used, inline >= 2 && safe_to_inject)) return false;
            var used = Object.create(arg_used);
            if (!can_inject_vars(defined, used, inline >= 3 && safe_to_inject)) return false;
            return !in_loop || in_loop.length == 0 || !is_reachable(fn, in_loop);
        }

        function append_var(decls, expressions, name, value) {
            var def = name.definition();
            if (!scope.var_names()[name.name]) {
                scope.var_names()[name.name] = true;
                decls.push(make_node(AST_VarDef, name, {
                    name: name,
                    value: null,
                }));
            }
            scope.variables.set(name.name, def);
            scope.enclosed.push(def);
            if (!value) return;
            var sym = make_node(AST_SymbolRef, name, name);
            def.references.push(sym);
            expressions.push(make_node(AST_Assign, self, {
                operator: "=",
                left: sym,
                right: value,
            }));
        }

        function flatten_args(decls, expressions) {
            var len = fn.argnames.length;
            for (var i = self.args.length; --i >= len;) {
                expressions.push(self.args[i]);
            }
            var default_args = [];
            for (i = len; --i >= 0;) {
                var argname = fn.argnames[i];
                var name;
                if (argname instanceof AST_DefaultValue) {
                    default_args.push(argname);
                    name = argname.name;
                } else {
                    name = argname;
                }
                var value = self.args[i];
                if (name.__unused || scope.var_names()[name.name]) {
                    if (value) expressions.push(value);
                } else {
                    var symbol = make_node(AST_SymbolVar, name, name);
                    name.definition().orig.push(symbol);
                    if ("__unused" in name) {
                        append_var(decls, expressions, symbol);
                        if (value) expressions.push(value);
                    } else {
                        if (!value && in_loop && argname === name) value = make_node(AST_Undefined, self);
                        append_var(decls, expressions, symbol, value);
                    }
                }
            }
            decls.reverse();
            expressions.reverse();
            for (i = default_args.length; --i >= 0;) {
                var node = default_args[i];
                if ("__unused" in node.name) {
                    expressions.push(node.value);
                } else {
                    var sym = make_node(AST_SymbolRef, node.name, node.name);
                    node.name.definition().references.push(sym);
                    expressions.push(make_node(AST_Assign, node, {
                        operator: "=",
                        left: sym,
                        right: node.value,
                    }));
                }
            }
        }

        function flatten_destructured(decls, expressions) {
            expressions.push(make_node(AST_Assign, self, {
                operator: "=",
                left: make_node(AST_DestructuredArray, self, {
                    elements: fn.argnames.map(function(argname) {
                        return argname.convert_symbol(AST_SymbolRef, process);
                    }),
                    rest: fn.rest && fn.rest.convert_symbol(AST_SymbolRef, process),
                }),
                right: make_node(AST_Array, self, { elements: self.args.slice() }),
            }));

            function process(ref, name) {
                var def = name.definition();
                def.references.push(ref);
                var symbol = make_node(AST_SymbolVar, name, name);
                def.orig.push(symbol);
                append_var(decls, expressions, symbol);
            }
        }

        function flatten_var(name) {
            var redef = name.definition().redefined();
            if (redef) {
                name = name.clone();
                name.thedef = redef;
            }
            return name;
        }

        function flatten_vars(decls, expressions) {
            var args = [ insert, 0 ];
            var decl_var = [], expr_var = [], expr_loop = [];
            for (var i = 0; i < fn.body.length; i++) {
                var stat = fn.body[i];
                if (stat instanceof AST_LambdaDefinition) {
                    if (in_loop) {
                        var name = make_node(AST_SymbolVar, stat.name, flatten_var(stat.name));
                        name.definition().orig.push(name);
                        append_var(decls, expressions, name, to_func_expr(stat, true));
                    } else {
                        var def = stat.name.definition();
                        scope.functions.set(def.name, def);
                        scope.variables.set(def.name, def);
                        scope.enclosed.push(def);
                        scope.var_names()[def.name] = true;
                        args.push(stat);
                    }
                    continue;
                }
                if (!(stat instanceof AST_Var)) continue;
                for (var j = 0; j < stat.definitions.length; j++) {
                    var var_def = stat.definitions[j];
                    var name = flatten_var(var_def.name);
                    append_var(decl_var, expr_var, name, var_def.value);
                    if (in_loop && !HOP(arg_used, name.name)) {
                        var def = fn.variables.get(name.name);
                        var sym = make_node(AST_SymbolRef, name, name);
                        def.references.push(sym);
                        expr_loop.push(make_node(AST_Assign, var_def, {
                            operator: "=",
                            left: sym,
                            right: make_node(AST_Undefined, name),
                        }));
                    }
                }
            }
            [].push.apply(decls, decl_var);
            [].push.apply(expressions, expr_loop);
            [].push.apply(expressions, expr_var);
            return args;
        }

        function flatten_fn() {
            var decls = [];
            var expressions = [];
            if (has_default > 1 || has_destructured || fn.rest) {
                flatten_destructured(decls, expressions);
            } else {
                flatten_args(decls, expressions);
            }
            var args = flatten_vars(decls, expressions);
            expressions.push(value);
            if (decls.length) args.push(make_node(AST_Var, fn, {
                definitions: decls
            }));
            [].splice.apply(scope.body, args);
            fn.enclosed.forEach(function(def) {
                if (scope.var_names()[def.name]) return;
                scope.enclosed.push(def);
                scope.var_names()[def.name] = true;
            });
            return expressions;
        }
    });

    OPT(AST_New, function(self, compressor) {
        if (compressor.option("sequences")) {
            var seq = lift_sequence_in_expression(self, compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        if (compressor.option("unused")) drop_unused_call_args(self, compressor);
        if (compressor.option("unsafe")) {
            var exp = self.expression;
            if (is_undeclared_ref(exp)) {
                switch (exp.name) {
                  case "Object":
                  case "RegExp":
                  case "Function":
                  case "Error":
                  case "Array":
                    return make_node(AST_Call, self, self).transform(compressor);
                }
            }
        }
        return self;
    });

    // (a = b, x && a = c) ---> a = x ? c : b
    // (a = b, x || a = c) ---> a = x ? b : c
    function to_conditional_assignment(compressor, def, value, node) {
        if (!(node instanceof AST_Binary)) return;
        if (!(node.operator == "&&" || node.operator == "||")) return;
        if (!(node.right instanceof AST_Assign)) return;
        if (node.right.operator != "=") return;
        if (!(node.right.left instanceof AST_SymbolRef)) return;
        if (node.right.left.definition() !== def) return;
        if (value.has_side_effects(compressor)) return;
        if (!safe_from_assignment(node.left)) return;
        if (!safe_from_assignment(node.right.right)) return;
        def.replaced++;
        return node.operator == "&&" ? make_node(AST_Conditional, node, {
            condition: node.left,
            consequent: node.right.right,
            alternative: value
        }) : make_node(AST_Conditional, node, {
            condition: node.left,
            consequent: value,
            alternative: node.right.right
        });

        function safe_from_assignment(node) {
            if (node.has_side_effects(compressor)) return;
            var hit = false;
            node.walk(new TreeWalker(function(node) {
                if (hit) return true;
                if (node instanceof AST_SymbolRef && node.definition() === def) return hit = true;
            }));
            return !hit;
        }
    }

    OPT(AST_Sequence, function(self, compressor) {
        var expressions = filter_for_side_effects();
        var end = expressions.length - 1;
        merge_assignments();
        trim_right_for_undefined();
        if (end == 0) {
            self = maintain_this_binding(compressor, compressor.parent(), compressor.self(), expressions[0]);
            if (!(self instanceof AST_Sequence)) self = self.optimize(compressor);
            return self;
        }
        self.expressions = expressions;
        return self;

        function filter_for_side_effects() {
            if (!compressor.option("side_effects")) return self.expressions;
            var expressions = [];
            var first = first_in_statement(compressor);
            var last = self.expressions.length - 1;
            self.expressions.forEach(function(expr, index) {
                if (index < last) expr = expr.drop_side_effect_free(compressor, first);
                if (expr) {
                    merge_sequence(expressions, expr);
                    first = false;
                }
            });
            return expressions;
        }

        function trim_right_for_undefined() {
            if (!compressor.option("side_effects")) return;
            while (end > 0 && is_undefined(expressions[end], compressor)) end--;
            if (end < expressions.length - 1) {
                expressions[end] = make_node(AST_UnaryPrefix, self, {
                    operator   : "void",
                    expression : expressions[end]
                });
                expressions.length = end + 1;
            }
        }

        function is_simple_assign(node) {
            return node instanceof AST_Assign
                && node.operator == "="
                && node.left instanceof AST_SymbolRef
                && node.left.definition();
        }

        function merge_assignments() {
            for (var i = 1; i < end; i++) {
                var prev = expressions[i - 1];
                var def = is_simple_assign(prev);
                if (!def) continue;
                var expr = expressions[i];
                if (compressor.option("conditionals")) {
                    var cond = to_conditional_assignment(compressor, def, prev.right, expr);
                    if (cond) {
                        prev.right = cond;
                        expressions.splice(i--, 1);
                        end--;
                        continue;
                    }
                }
                if (compressor.option("dead_code")
                    && is_simple_assign(expr) === def
                    && expr.right.is_constant_expression(def.scope.resolve())) {
                    expressions[--i] = prev.right;
                }
            }
        }
    });

    OPT(AST_UnaryPostfix, function(self, compressor) {
        if (compressor.option("sequences")) {
            var seq = lift_sequence_in_expression(self, compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        return try_evaluate(compressor, self);
    });

    var SIGN_OPS = makePredicate("+ -");
    var MULTIPLICATIVE_OPS = makePredicate("* / %");
    OPT(AST_UnaryPrefix, function(self, compressor) {
        var op = self.operator;
        var exp = self.expression;
        if (compressor.option("evaluate") && op == "delete" && !may_not_delete(exp)) {
            return make_sequence(self, [ exp, make_node(AST_True, self) ]).optimize(compressor);
        }
        if (compressor.option("sequences") && can_lift()) {
            var seq = lift_sequence_in_expression(self, compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        if (compressor.option("side_effects") && op == "void") {
            exp = exp.drop_side_effect_free(compressor);
            if (!exp) return make_node(AST_Undefined, self).optimize(compressor);
            self.expression = exp;
            return self;
        }
        if (compressor.option("booleans")) {
            if (op == "!" && exp.is_truthy()) {
                return make_sequence(self, [ exp, make_node(AST_False, self) ]).optimize(compressor);
            } else if (compressor.in_boolean_context()) switch (op) {
              case "!":
                if (exp instanceof AST_UnaryPrefix && exp.operator == "!") {
                    // !!foo ---> foo, if we're in boolean context
                    return exp.expression;
                }
                if (exp instanceof AST_Binary) {
                    self = best_of(compressor, self, exp.negate(compressor, first_in_statement(compressor)));
                }
                break;
              case "typeof":
                // typeof always returns a non-empty string, thus it's
                // always true in booleans
                AST_Node.warn("Boolean expression always true [{file}:{line},{col}]", self.start);
                var exprs = [ make_node(AST_True, self) ];
                if (!(exp instanceof AST_SymbolRef && can_drop_symbol(exp, compressor))) exprs.unshift(exp);
                return make_sequence(self, exprs).optimize(compressor);
            }
        }
        if (op == "-" && exp instanceof AST_Infinity) exp = exp.transform(compressor);
        if (compressor.option("evaluate")
            && exp instanceof AST_Binary
            && SIGN_OPS[op]
            && MULTIPLICATIVE_OPS[exp.operator]
            && (exp.left.is_constant() || !exp.right.has_side_effects(compressor))) {
            return make_node(AST_Binary, self, {
                operator: exp.operator,
                left: make_node(AST_UnaryPrefix, exp.left, {
                    operator: op,
                    expression: exp.left
                }),
                right: exp.right
            });
        }
        // avoids infinite recursion of numerals
        return op == "-" && (exp instanceof AST_Number || exp instanceof AST_Infinity)
            ? self : try_evaluate(compressor, self);

        function may_not_delete(node) {
            return node instanceof AST_Infinity
                || node instanceof AST_NaN
                || node instanceof AST_NewTarget
                || node instanceof AST_PropAccess
                || node instanceof AST_SymbolRef
                || node instanceof AST_Undefined;
        }

        function can_lift() {
            switch (op) {
              case "delete":
                return !may_not_delete(exp.tail_node());
              case "typeof":
                return !is_undeclared_ref(exp.tail_node());
              default:
                return true;
            }
        }
    });

    OPT(AST_Await, function(self, compressor) {
        if (!compressor.option("awaits")) return self;
        if (compressor.option("sequences")) {
            var seq = lift_sequence_in_expression(self, compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        if (compressor.option("side_effects")) {
            var exp = self.expression;
            if (exp instanceof AST_Await) return exp.optimize(compressor);
            if (exp instanceof AST_UnaryPrefix) {
                if (exp.expression instanceof AST_Await) return exp.optimize(compressor);
                if (exp.operator == "void") return make_node(AST_UnaryPrefix, self, {
                    operator: "void",
                    expression: make_node(AST_Await, self, { expression: exp.expression }),
                }).optimize(compressor);
            }
            for (var level = 0, node = self, parent; parent = compressor.parent(level++); node = parent) {
                if (is_arrow(parent)) {
                    if (parent.value === node) return exp.optimize(compressor);
                } else if (parent instanceof AST_Return) {
                    var drop = true;
                    do {
                        node = parent;
                        parent = compressor.parent(level++);
                        if (parent instanceof AST_Try && parent.bfinally && parent.bfinally !== node) {
                            drop = false;
                            break;
                        }
                    } while (parent && !(parent instanceof AST_Scope));
                    if (drop) return exp.optimize(compressor);
                } else if (parent instanceof AST_Sequence) {
                    if (parent.tail_node() === node) continue;
                }
                break;
            }
        }
        return self;
    });

    OPT(AST_Yield, function(self, compressor) {
        if (!compressor.option("yields")) return self;
        if (compressor.option("sequences")) {
            var seq = lift_sequence_in_expression(self, compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        var exp = self.expression;
        if (self.nested && exp.TYPE == "Call") {
            var inlined = exp.clone().optimize(compressor);
            if (inlined.TYPE != "Call") return inlined;
        }
        return self;
    });

    AST_Binary.DEFMETHOD("lift_sequences", function(compressor) {
        if (this.left instanceof AST_PropAccess) {
            if (!(this.left.expression instanceof AST_Sequence)) return this;
            var x = this.left.expression.expressions.slice();
            var e = this.clone();
            e.left = e.left.clone();
            e.left.expression = x.pop();
            x.push(e);
            return make_sequence(this, x);
        }
        if (this.left instanceof AST_Sequence) {
            var x = this.left.expressions.slice();
            var e = this.clone();
            e.left = x.pop();
            x.push(e);
            return make_sequence(this, x);
        }
        if (this.right instanceof AST_Sequence) {
            if (this.left.has_side_effects(compressor)) return this;
            var assign = this.operator == "=" && this.left instanceof AST_SymbolRef;
            var x = this.right.expressions;
            var last = x.length - 1;
            for (var i = 0; i < last; i++) {
                if (!assign && x[i].has_side_effects(compressor)) break;
            }
            if (i == last) {
                x = x.slice();
                var e = this.clone();
                e.right = x.pop();
                x.push(e);
                return make_sequence(this, x);
            }
            if (i > 0) {
                var e = this.clone();
                e.right = make_sequence(this.right, x.slice(i));
                x = x.slice(0, i);
                x.push(e);
                return make_sequence(this, x);
            }
        }
        return this;
    });

    var indexFns = makePredicate("indexOf lastIndexOf");
    var commutativeOperators = makePredicate("== === != !== * & | ^");
    function is_object(node) {
        if (node instanceof AST_Assign) return node.operator == "=" && is_object(node.right);
        if (node instanceof AST_Sequence) return is_object(node.tail_node());
        if (node instanceof AST_SymbolRef) return is_object(node.fixed_value());
        return node instanceof AST_Array
            || node instanceof AST_Class
            || node instanceof AST_Lambda
            || node instanceof AST_New
            || node instanceof AST_Object;
    }

    function is_primitive(compressor, node) {
        if (node.is_constant()) return true;
        if (node instanceof AST_Assign) return node.operator != "=" || is_primitive(compressor, node.right);
        if (node instanceof AST_Binary) {
            return !lazy_op[node.operator]
                || is_primitive(compressor, node.left) && is_primitive(compressor, node.right);
        }
        if (node instanceof AST_Conditional) {
            return is_primitive(compressor, node.consequent) && is_primitive(compressor, node.alternative);
        }
        if (node instanceof AST_Sequence) return is_primitive(compressor, node.tail_node());
        if (node instanceof AST_SymbolRef) {
            var fixed = node.fixed_value();
            return fixed && is_primitive(compressor, fixed);
        }
        if (node instanceof AST_Template) return !node.tag || is_raw_tag(compressor, node.tag);
        if (node instanceof AST_Unary) return true;
    }

    function repeatable(compressor, node) {
        if (node instanceof AST_Dot) return repeatable(compressor, node.expression);
        if (node instanceof AST_Sub) {
            return repeatable(compressor, node.expression) && repeatable(compressor, node.property);
        }
        if (node instanceof AST_Symbol) return true;
        return !node.has_side_effects(compressor);
    }

    OPT(AST_Binary, function(self, compressor) {
        function reversible() {
            return self.left.is_constant()
                || self.right.is_constant()
                || !self.left.has_side_effects(compressor)
                    && !self.right.has_side_effects(compressor);
        }
        function reverse(op) {
            if (reversible()) {
                if (op) self.operator = op;
                var tmp = self.left;
                self.left = self.right;
                self.right = tmp;
            }
        }
        function swap_chain() {
            var rhs = self.right;
            self.left = make_node(AST_Binary, self, {
                operator: self.operator,
                left: self.left,
                right: rhs.left,
                start: self.left.start,
                end: rhs.left.end
            });
            self.right = rhs.right;
            self.left = self.left.transform(compressor);
        }
        if (commutativeOperators[self.operator]
            && self.right.is_constant()
            && !self.left.is_constant()
            && !(self.left instanceof AST_Binary
                && PRECEDENCE[self.left.operator] >= PRECEDENCE[self.operator])) {
            // if right is a constant, whatever side effects the
            // left side might have could not influence the
            // result.  hence, force switch.
            reverse();
        }
        if (compressor.option("sequences")) {
            var seq = self.lift_sequences(compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        if (compressor.option("assignments") && lazy_op[self.operator]) {
            var assign = self.right;
            // a || (a = x) ---> a = a || x
            // a && (a = x) ---> a = a && x
            if (self.left instanceof AST_SymbolRef
                && assign instanceof AST_Assign
                && assign.operator == "="
                && self.left.equivalent_to(assign.left)) {
                self.right = assign.right;
                assign.right = self;
                return assign;
            }
        }
        if (compressor.option("comparisons")) switch (self.operator) {
          case "===":
          case "!==":
            if (is_undefined(self.left, compressor) && self.right.is_defined(compressor)) {
                AST_Node.warn("Expression always defined [{file}:{line},{col}]", self.start);
                return make_sequence(self, [
                    self.right,
                    make_node(self.operator == "===" ? AST_False : AST_True, self)
                ]).optimize(compressor);
            }
            var is_strict_comparison = true;
            if ((self.left.is_string(compressor) && self.right.is_string(compressor)) ||
                (self.left.is_number(compressor) && self.right.is_number(compressor)) ||
                (self.left.is_boolean(compressor) && self.right.is_boolean(compressor)) ||
                repeatable(compressor, self.left) && self.left.equivalent_to(self.right)) {
                self.operator = self.operator.slice(0, 2);
            }
            // XXX: intentionally falling down to the next case
          case "==":
          case "!=":
            // void 0 == x ---> null == x
            if (!is_strict_comparison && is_undefined(self.left, compressor)) {
                self.left = make_node(AST_Null, self.left);
            }
            // "undefined" == typeof x ---> undefined === x
            else if (compressor.option("typeofs")
                && self.left instanceof AST_String
                && self.left.value == "undefined"
                && self.right instanceof AST_UnaryPrefix
                && self.right.operator == "typeof") {
                var expr = self.right.expression;
                if (expr instanceof AST_SymbolRef ? expr.is_declared(compressor)
                    : !(expr instanceof AST_PropAccess && compressor.option("ie"))) {
                    self.right = expr;
                    self.left = make_node(AST_Undefined, self.left).optimize(compressor);
                    if (self.operator.length == 2) self.operator += "=";
                }
            }
            // obj !== obj ---> false
            else if (self.left instanceof AST_SymbolRef
                && self.right instanceof AST_SymbolRef
                && self.left.definition() === self.right.definition()
                && is_object(self.left)) {
                return make_node(self.operator[0] == "=" ? AST_True : AST_False, self).optimize(compressor);
            }
            break;
          case "&&":
          case "||":
            // void 0 !== x && null !== x ---> null != x
            // void 0 === x || null === x ---> null == x
            var lhs = self.left;
            if (lhs.operator == self.operator) {
                lhs = lhs.right;
            }
            if (lhs instanceof AST_Binary
                && lhs.operator == (self.operator == "&&" ? "!==" : "===")
                && self.right instanceof AST_Binary
                && lhs.operator == self.right.operator
                && (is_undefined(lhs.left, compressor) && self.right.left instanceof AST_Null
                    || lhs.left instanceof AST_Null && is_undefined(self.right.left, compressor))
                && !lhs.right.has_side_effects(compressor)
                && lhs.right.equivalent_to(self.right.right)) {
                var combined = make_node(AST_Binary, self, {
                    operator: lhs.operator.slice(0, -1),
                    left: make_node(AST_Null, self),
                    right: lhs.right
                });
                if (lhs !== self.left) {
                    combined = make_node(AST_Binary, self, {
                        operator: self.operator,
                        left: self.left.left,
                        right: combined
                    });
                }
                return combined;
            }
            break;
        }
        var in_bool = false;
        var parent = compressor.parent();
        if (compressor.option("booleans")) {
            var lhs = self.left;
            if (lazy_op[self.operator] && !lhs.has_side_effects(compressor)) {
                if (lhs.equivalent_to(self.right)) {
                    return maintain_this_binding(compressor, parent, compressor.self(), lhs).optimize(compressor);
                }
                mark_duplicate_condition(compressor, lhs);
            }
            in_bool = compressor.in_boolean_context();
        }
        if (in_bool) switch (self.operator) {
          case "+":
            var ll = self.left.evaluate(compressor);
            var rr = self.right.evaluate(compressor);
            if (ll && typeof ll == "string") {
                AST_Node.warn("+ in boolean context always true [{file}:{line},{col}]", self.start);
                return make_sequence(self, [
                    self.right,
                    make_node(AST_True, self)
                ]).optimize(compressor);
            }
            if (rr && typeof rr == "string") {
                AST_Node.warn("+ in boolean context always true [{file}:{line},{col}]", self.start);
                return make_sequence(self, [
                    self.left,
                    make_node(AST_True, self)
                ]).optimize(compressor);
            }
            break;
          case "==":
            if (self.left instanceof AST_String && self.left.value == "" && self.right.is_string(compressor)) {
                return make_node(AST_UnaryPrefix, self, {
                    operator: "!",
                    expression: self.right
                }).optimize(compressor);
            }
            break;
          case "!=":
            if (self.left instanceof AST_String && self.left.value == "" && self.right.is_string(compressor)) {
                return self.right.optimize(compressor);
            }
            break;
        }
        if (compressor.option("comparisons") && self.is_boolean(compressor)) {
            if (!(parent instanceof AST_Binary) || parent instanceof AST_Assign) {
                var negated = best_of(compressor, self, make_node(AST_UnaryPrefix, self, {
                    operator: "!",
                    expression: self.negate(compressor, first_in_statement(compressor))
                }));
                if (negated !== self) return negated;
            }
            switch (self.operator) {
              case ">": reverse("<"); break;
              case ">=": reverse("<="); break;
            }
        }
        // x && (y && z) ---> x && y && z
        // x || (y || z) ---> x || y || z
        if (compressor.option("conditionals")
            && lazy_op[self.operator]
            && self.right instanceof AST_Binary
            && self.operator == self.right.operator) {
            swap_chain();
        }
        if (compressor.option("strings") && self.operator == "+") {
            // "foo" + 42 + "" ---> "foo" + 42
            if (self.right instanceof AST_String
                && self.right.value == ""
                && self.left.is_string(compressor)) {
                return self.left.optimize(compressor);
            }
            // "" + ("foo" + 42) ---> "foo" + 42
            if (self.left instanceof AST_String
                && self.left.value == ""
                && self.right.is_string(compressor)) {
                return self.right.optimize(compressor);
            }
            // "" + 42 + "foo" ---> 42 + "foo"
            if (self.left instanceof AST_Binary
                && self.left.operator == "+"
                && self.left.left instanceof AST_String
                && self.left.left.value == ""
                && self.right.is_string(compressor)) {
                self.left = self.left.right;
                return self.optimize(compressor);
            }
            // "x" + (y + "z") ---> "x" + y + "z"
            // x + ("y" + z) ---> x + "y" + z
            if (self.right instanceof AST_Binary
                && self.operator == self.right.operator
                && (self.left.is_string(compressor) && self.right.is_string(compressor)
                    || self.right.left.is_string(compressor)
                        && (self.left.is_constant() || !self.right.right.has_side_effects(compressor)))) {
                swap_chain();
            }
        }
        if (compressor.option("evaluate")) {
            var associative = true;
            switch (self.operator) {
              case "&&":
                var ll = fuzzy_eval(compressor, self.left);
                if (!ll) {
                    AST_Node.warn("Condition left of && always false [{file}:{line},{col}]", self.start);
                    return maintain_this_binding(compressor, parent, compressor.self(), self.left).optimize(compressor);
                } else if (!(ll instanceof AST_Node)) {
                    AST_Node.warn("Condition left of && always true [{file}:{line},{col}]", self.start);
                    return make_sequence(self, [ self.left, self.right ]).optimize(compressor);
                }
                var rr = self.right.evaluate(compressor);
                if (!rr) {
                    if (in_bool) {
                        AST_Node.warn("Boolean && always false [{file}:{line},{col}]", self.start);
                        return make_sequence(self, [
                            self.left,
                            make_node(AST_False, self)
                        ]).optimize(compressor);
                    } else self.falsy = true;
                } else if (!(rr instanceof AST_Node)) {
                    if (in_bool || parent.operator == "&&" && parent.left === compressor.self()) {
                        AST_Node.warn("Dropping side-effect-free && [{file}:{line},{col}]", self.start);
                        return self.left.optimize(compressor);
                    }
                }
                // (x || false) && y ---> x ? y : false
                if (self.left.operator == "||") {
                    var lr = fuzzy_eval(compressor, self.left.right);
                    if (!lr) return make_node(AST_Conditional, self, {
                        condition: self.left.left,
                        consequent: self.right,
                        alternative: self.left.right
                    }).optimize(compressor);
                }
                break;
              case "??":
                var nullish = true;
              case "||":
                var ll = fuzzy_eval(compressor, self.left, nullish);
                if (nullish ? ll == null : !ll) {
                    AST_Node.warn("Condition left of {operator} always {value} [{file}:{line},{col}]", {
                        operator: self.operator,
                        value: nullish ? "nulish" : "false",
                        file: self.start.file,
                        line: self.start.line,
                        col: self.start.col,
                    });
                    return make_sequence(self, [ self.left, self.right ]).optimize(compressor);
                } else if (!(ll instanceof AST_Node)) {
                    AST_Node.warn("Condition left of {operator} always {value} [{file}:{line},{col}]", {
                        operator: self.operator,
                        value: nullish ? "defined" : "true",
                        file: self.start.file,
                        line: self.start.line,
                        col: self.start.col,
                    });
                    return maintain_this_binding(compressor, parent, compressor.self(), self.left).optimize(compressor);
                }
                var rr = self.right.evaluate(compressor);
                if (!rr) {
                    if (in_bool || parent.operator == "||" && parent.left === compressor.self()) {
                        AST_Node.warn("Dropping side-effect-free {operator} [{file}:{line},{col}]", {
                            operator: self.operator,
                            file: self.start.file,
                            line: self.start.line,
                            col: self.start.col,
                        });
                        return self.left.optimize(compressor);
                    }
                } else if (!nullish && !(rr instanceof AST_Node)) {
                    if (in_bool) {
                        AST_Node.warn("Boolean || always true [{file}:{line},{col}]", self.start);
                        return make_sequence(self, [
                            self.left,
                            make_node(AST_True, self)
                        ]).optimize(compressor);
                    } else self.truthy = true;
                }
                // x && true || y ---> x ? true : y
                if (!nullish && self.left.operator == "&&") {
                    var lr = fuzzy_eval(compressor, self.left.right);
                    if (lr && !(lr instanceof AST_Node)) return make_node(AST_Conditional, self, {
                        condition: self.left.left,
                        consequent: self.left.right,
                        alternative: self.right
                    }).optimize(compressor);
                }
                break;
              case "+":
                // "foo" + ("bar" + x) ---> "foobar" + x
                if (self.left instanceof AST_Constant
                    && self.right instanceof AST_Binary
                    && self.right.operator == "+"
                    && self.right.left instanceof AST_Constant
                    && self.right.is_string(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "+",
                        left: make_node(AST_String, self.left, {
                            value: "" + self.left.value + self.right.left.value,
                            start: self.left.start,
                            end: self.right.left.end
                        }),
                        right: self.right.right
                    });
                }
                // (x + "foo") + "bar" ---> x + "foobar"
                if (self.right instanceof AST_Constant
                    && self.left instanceof AST_Binary
                    && self.left.operator == "+"
                    && self.left.right instanceof AST_Constant
                    && self.left.is_string(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "+",
                        left: self.left.left,
                        right: make_node(AST_String, self.right, {
                            value: "" + self.left.right.value + self.right.value,
                            start: self.left.right.start,
                            end: self.right.end
                        })
                    });
                }
                // a + -b ---> a - b
                if (self.right instanceof AST_UnaryPrefix
                    && self.right.operator == "-"
                    && self.left.is_number(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "-",
                        left: self.left,
                        right: self.right.expression
                    });
                    break;
                }
                // -a + b ---> b - a
                if (self.left instanceof AST_UnaryPrefix
                    && self.left.operator == "-"
                    && reversible()
                    && self.right.is_number(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "-",
                        left: self.right,
                        right: self.left.expression
                    });
                    break;
                }
                // (a + b) + 3 ---> 3 + (a + b)
                if (compressor.option("unsafe_math")
                    && self.left instanceof AST_Binary
                    && PRECEDENCE[self.left.operator] == PRECEDENCE[self.operator]
                    && self.right.is_constant()
                    && (self.right.is_boolean(compressor) || self.right.is_number(compressor))
                    && self.left.is_number(compressor)
                    && !self.left.right.is_constant()
                    && (self.left.left.is_boolean(compressor) || self.left.left.is_number(compressor))) {
                    self = make_node(AST_Binary, self, {
                        operator: self.left.operator,
                        left: make_node(AST_Binary, self, {
                            operator: self.operator,
                            left: self.right,
                            right: self.left.left
                        }),
                        right: self.left.right
                    });
                    break;
                }
              case "-":
                // a - -b ---> a + b
                if (self.right instanceof AST_UnaryPrefix
                    && self.right.operator == "-"
                    && self.left.is_number(compressor)
                    && self.right.expression.is_number(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "+",
                        left: self.left,
                        right: self.right.expression
                    });
                    break;
                }
              case "*":
              case "/":
                associative = compressor.option("unsafe_math");
                // +a - b ---> a - b
                // a - +b ---> a - b
                if (self.operator != "+") [ "left", "right" ].forEach(function(operand) {
                    var node = self[operand];
                    if (node instanceof AST_UnaryPrefix && node.operator == "+") {
                        var exp = node.expression;
                        if (exp.is_boolean(compressor) || exp.is_number(compressor) || exp.is_string(compressor)) {
                            self[operand] = exp;
                        }
                    }
                });
              case "&":
              case "|":
              case "^":
                // a + +b ---> +b + a
                if (self.operator != "-"
                    && self.operator != "/"
                    && (self.left.is_boolean(compressor) || self.left.is_number(compressor))
                    && (self.right.is_boolean(compressor) || self.right.is_number(compressor))
                    && reversible()
                    && !(self.left instanceof AST_Binary
                        && self.left.operator != self.operator
                        && PRECEDENCE[self.left.operator] >= PRECEDENCE[self.operator])) {
                    var reversed = make_node(AST_Binary, self, {
                        operator: self.operator,
                        left: self.right,
                        right: self.left
                    });
                    if (self.right instanceof AST_Constant
                        && !(self.left instanceof AST_Constant)) {
                        self = best_of(compressor, reversed, self);
                    } else {
                        self = best_of(compressor, self, reversed);
                    }
                }
                if (!associative || !self.is_number(compressor)) break;
                // a + (b + c) ---> (a + b) + c
                if (self.right instanceof AST_Binary
                    && self.right.operator != "%"
                    && PRECEDENCE[self.right.operator] == PRECEDENCE[self.operator]
                    && self.right.is_number(compressor)
                    && (self.operator != "+"
                        || self.right.left.is_boolean(compressor)
                        || self.right.left.is_number(compressor))
                    && (self.operator != "-" || !self.left.is_negative_zero())
                    && (self.right.left.is_constant_expression()
                        || !self.right.right.has_side_effects(compressor))
                    && !is_modify_array(self.right.right)) {
                    self = make_node(AST_Binary, self, {
                        operator: align(self.operator, self.right.operator),
                        left: make_node(AST_Binary, self.left, {
                            operator: self.operator,
                            left: self.left,
                            right: self.right.left,
                            start: self.left.start,
                            end: self.right.left.end
                        }),
                        right: self.right.right
                    });
                    if (self.operator == "+"
                        && !self.right.is_boolean(compressor)
                        && !self.right.is_number(compressor)) {
                        self.right = make_node(AST_UnaryPrefix, self.right, {
                            operator: "+",
                            expression: self.right
                        });
                    }
                }
                // (2 * n) * 3 ---> 6 * n
                // (n + 2) + 3 ---> n + 5
                if (self.right instanceof AST_Constant
                    && self.left instanceof AST_Binary
                    && self.left.operator != "%"
                    && PRECEDENCE[self.left.operator] == PRECEDENCE[self.operator]
                    && self.left.is_number(compressor)) {
                    if (self.left.left instanceof AST_Constant) {
                        var lhs = make_binary(self.left, self.operator, self.left.left, self.right, self.left.left.start, self.right.end);
                        self = make_binary(self, self.left.operator, try_evaluate(compressor, lhs), self.left.right);
                    } else if (self.left.right instanceof AST_Constant) {
                        var op = align(self.left.operator, self.operator);
                        var rhs = try_evaluate(compressor, make_binary(self.left, op, self.left.right, self.right));
                        if (rhs.is_constant()
                            && !(self.left.operator == "-"
                                && self.right.value != 0
                                && +rhs.value == 0
                                && self.left.left.is_negative_zero())) {
                            self = make_binary(self, self.left.operator, self.left.left, rhs);
                        }
                    }
                }
                break;
            }
            if (!(parent instanceof AST_UnaryPrefix && parent.operator == "delete")) {
                if (self.left instanceof AST_Number && !self.right.is_constant()) switch (self.operator) {
                  // 0 + n ---> n
                  case "+":
                    if (self.left.value == 0) {
                        if (self.right.is_boolean(compressor)) return make_node(AST_UnaryPrefix, self, {
                            operator: "+",
                            expression: self.right
                        }).optimize(compressor);
                        if (self.right.is_number(compressor) && !self.right.is_negative_zero()) return self.right;
                    }
                    break;
                  // 1 * n ---> n
                  case "*":
                    if (self.left.value == 1) {
                        return self.right.is_number(compressor) ? self.right : make_node(AST_UnaryPrefix, self, {
                            operator: "+",
                            expression: self.right
                        }).optimize(compressor);
                    }
                    break;
                }
                if (self.right instanceof AST_Number && !self.left.is_constant()) switch (self.operator) {
                  // n + 0 ---> n
                  case "+":
                    if (self.right.value == 0) {
                        if (self.left.is_boolean(compressor)) return make_node(AST_UnaryPrefix, self, {
                            operator: "+",
                            expression: self.left
                        }).optimize(compressor);
                        if (self.left.is_number(compressor) && !self.left.is_negative_zero()) return self.left;
                    }
                    break;
                  // n - 0 ---> n
                  case "-":
                    if (self.right.value == 0) {
                        return self.left.is_number(compressor) ? self.left : make_node(AST_UnaryPrefix, self, {
                            operator: "+",
                            expression: self.left
                        }).optimize(compressor);
                    }
                    break;
                  // n / 1 ---> n
                  case "/":
                    if (self.right.value == 1) {
                        return self.left.is_number(compressor) ? self.left : make_node(AST_UnaryPrefix, self, {
                            operator: "+",
                            expression: self.left
                        }).optimize(compressor);
                    }
                    break;
                }
            }
        }
        if (compressor.option("typeofs")) switch (self.operator) {
          case "&&":
            mark_locally_defined(self.left, self.right, null);
            break;
          case "||":
            mark_locally_defined(self.left, null, self.right);
            break;
        }
        if (compressor.option("unsafe")) {
            var indexRight = is_indexFn(self.right);
            if (in_bool
                && indexRight
                && (self.operator == "==" || self.operator == "!=")
                && self.left instanceof AST_Number
                && self.left.value == 0) {
                return (self.operator == "==" ? make_node(AST_UnaryPrefix, self, {
                    operator: "!",
                    expression: self.right
                }) : self.right).optimize(compressor);
            }
            var indexLeft = is_indexFn(self.left);
            if (compressor.option("comparisons") && is_indexOf_match_pattern()) {
                var node = make_node(AST_UnaryPrefix, self, {
                    operator: "!",
                    expression: make_node(AST_UnaryPrefix, self, {
                        operator: "~",
                        expression: indexLeft ? self.left : self.right
                    })
                });
                switch (self.operator) {
                  case "<":
                    if (indexLeft) break;
                  case "<=":
                  case "!=":
                    node = make_node(AST_UnaryPrefix, self, {
                        operator: "!",
                        expression: node
                    });
                    break;
                }
                return node.optimize(compressor);
            }
        }
        return try_evaluate(compressor, self);

        function is_modify_array(node) {
            var found = false;
            node.walk(new TreeWalker(function(node) {
                if (found) return true;
                if (node instanceof AST_Assign) {
                    if (node.left instanceof AST_PropAccess) return found = true;
                } else if (node instanceof AST_Unary) {
                    if (unary_side_effects[node.operator] && node.expression instanceof AST_PropAccess) {
                        return found = true;
                    }
                }
            }));
            return found;
        }

        function align(ref, op) {
            switch (ref) {
              case "-":
                return op == "+" ? "-" : "+";
              case "/":
                return op == "*" ? "/" : "*";
              default:
                return op;
            }
        }

        function make_binary(orig, op, left, right, start, end) {
            if (op == "+") {
                if (!left.is_boolean(compressor) && !left.is_number(compressor)) {
                    left = make_node(AST_UnaryPrefix, left, {
                        operator: "+",
                        expression: left
                    });
                }
                if (!right.is_boolean(compressor) && !right.is_number(compressor)) {
                    right = make_node(AST_UnaryPrefix, right, {
                        operator: "+",
                        expression: right
                    });
                }
            }
            return make_node(AST_Binary, orig, {
                operator: op,
                left: left,
                right: right,
                start: start,
                end: end
            });
        }

        function is_indexFn(node) {
            return node.TYPE == "Call"
                && node.expression instanceof AST_Dot
                && indexFns[node.expression.property];
        }

        function is_indexOf_match_pattern() {
            switch (self.operator) {
              case "<=":
                // 0 <= array.indexOf(string) ---> !!~array.indexOf(string)
                return indexRight && self.left instanceof AST_Number && self.left.value == 0;
              case "<":
                // array.indexOf(string) < 0 ---> !~array.indexOf(string)
                if (indexLeft && self.right instanceof AST_Number && self.right.value == 0) return true;
                // -1 < array.indexOf(string) ---> !!~array.indexOf(string)
              case "==":
              case "!=":
                // -1 == array.indexOf(string) ---> !~array.indexOf(string)
                // -1 != array.indexOf(string) ---> !!~array.indexOf(string)
                if (!indexRight) return false;
                return self.left instanceof AST_Number && self.left.value == -1
                    || self.left instanceof AST_UnaryPrefix && self.left.operator == "-"
                        && self.left.expression instanceof AST_Number && self.left.expression.value == 1;
            }
        }
    });

    OPT(AST_SymbolExport, function(self) {
        return self;
    });

    function recursive_ref(compressor, def, fn) {
        var level = 0, node = compressor.self();
        do {
            if (node === fn) return node;
            if (is_lambda(node) && node.name && node.name.definition() === def) return node;
        } while (node = compressor.parent(level++));
    }

    function same_scope(def) {
        var scope = def.scope.resolve();
        return all(def.references, function(ref) {
            return scope === ref.scope.resolve();
        });
    }

    OPT(AST_SymbolRef, function(self, compressor) {
        if (!compressor.option("ie")
            && is_undeclared_ref(self)
            // testing against `self.scope.uses_with` is an optimization
            && !(self.scope.resolve().uses_with && compressor.find_parent(AST_With))) {
            switch (self.name) {
              case "undefined":
                return make_node(AST_Undefined, self).optimize(compressor);
              case "NaN":
                return make_node(AST_NaN, self).optimize(compressor);
              case "Infinity":
                return make_node(AST_Infinity, self).optimize(compressor);
            }
        }
        var parent = compressor.parent();
        if (compressor.option("reduce_vars") && is_lhs(compressor.self(), parent) !== compressor.self()) {
            var def = self.definition();
            var fixed = self.fixed_value();
            var single_use = def.single_use && !(parent instanceof AST_Call && parent.is_expr_pure(compressor));
            if (single_use) {
                if (is_lambda(fixed)) {
                    if ((def.scope !== self.scope.resolve() || def.in_loop)
                        && (!compressor.option("reduce_funcs") || def.escaped.depth == 1 || fixed.inlined)) {
                        single_use = false;
                    } else if (recursive_ref(compressor, def, fixed)) {
                        single_use = false;
                    } else if (fixed.name && fixed.name.definition() !== def) {
                        single_use = false;
                    } else if (fixed.parent_scope !== self.scope || is_funarg(def)) {
                        single_use = fixed.is_constant_expression(self.scope);
                        if (single_use == "f") {
                            var scope = self.scope;
                            do {
                                if (scope instanceof AST_LambdaDefinition || scope instanceof AST_LambdaExpression) {
                                    scope.inlined = true;
                                }
                            } while (scope = scope.parent_scope);
                        }
                    } else if (fixed.name && (fixed.name.name == "await" && is_async(fixed)
                        || fixed.name.name == "yield" && is_generator(fixed))) {
                        single_use = false;
                    } else if (fixed.has_side_effects(compressor)) {
                        single_use = false;
                    } else if (compressor.option("ie") && fixed instanceof AST_Class) {
                        single_use = false;
                    }
                    if (single_use) fixed.parent_scope = self.scope;
                } else if (!fixed
                    || def.recursive_refs > 0
                    || !fixed.is_constant_expression()
                    || fixed.drop_side_effect_free(compressor)) {
                    single_use = false;
                }
            }
            if (single_use) {
                def.single_use = false;
                fixed._squeezed = true;
                fixed.single_use = true;
                if (fixed instanceof AST_DefClass) fixed = to_class_expr(fixed);
                if (fixed instanceof AST_LambdaDefinition) fixed = to_func_expr(fixed);
                if (is_lambda(fixed)) {
                    var scope = self.scope.resolve();
                    fixed.enclosed.forEach(function(def) {
                        if (fixed.variables.has(def.name)) return;
                        if (scope.var_names()[def.name]) return;
                        scope.enclosed.push(def);
                        scope.var_names()[def.name] = true;
                    });
                }
                var value;
                if (def.recursive_refs > 0) {
                    value = fixed.clone(true);
                    var defun_def = value.name.definition();
                    var lambda_def = value.variables.get(value.name.name);
                    var name = lambda_def && lambda_def.orig[0];
                    var def_fn_name, symbol_type;
                    if (value instanceof AST_Class) {
                        def_fn_name = "def_function";
                        symbol_type = AST_SymbolClass;
                    } else {
                        def_fn_name = "def_variable";
                        symbol_type = AST_SymbolLambda;
                    }
                    if (!(name instanceof symbol_type)) {
                        name = make_node(symbol_type, value.name, value.name);
                        name.scope = value;
                        value.name = name;
                        lambda_def = value[def_fn_name](name);
                        lambda_def.recursive_refs = def.recursive_refs;
                    }
                    value.walk(new TreeWalker(function(node) {
                        if (node instanceof AST_SymbolDeclaration) {
                            if (node !== name) {
                                var def = node.definition();
                                def.orig.push(node);
                                def.eliminated++;
                            }
                            return;
                        }
                        if (!(node instanceof AST_SymbolRef)) return;
                        var def = node.definition();
                        if (def === defun_def) {
                            node.thedef = lambda_def;
                            lambda_def.references.push(node);
                        } else {
                            def.single_use = false;
                            var fn = node.fixed_value();
                            if (!is_lambda(fn)) return;
                            if (!fn.name) return;
                            if (fn.name.definition() !== def) return;
                            if (def.scope !== fn.name.scope) return;
                            if (fixed.variables.get(fn.name.name) !== def) return;
                            fn.name = fn.name.clone();
                            var value_def = value.variables.get(fn.name.name) || value[def_fn_name](fn.name);
                            node.thedef = value_def;
                            value_def.references.push(node);
                        }
                    }));
                } else {
                    if (fixed instanceof AST_Scope) {
                        compressor.push(fixed);
                        value = fixed.optimize(compressor);
                        compressor.pop();
                    } else {
                        value = fixed.optimize(compressor);
                    }
                    value = value.transform(new TreeTransformer(function(node, descend) {
                        if (node instanceof AST_Scope) return node;
                        node = node.clone();
                        descend(node, this);
                        return node;
                    }));
                }
                def.replaced++;
                return value;
            }
            var local = self.fixed !== def.fixed;
            if (fixed && (local || def.should_replace !== false)) {
                var ev, init;
                if (fixed instanceof AST_This) {
                    if (!is_funarg(def) && same_scope(def)) init = fixed;
                } else if ((ev = fixed.evaluate(compressor, true)) !== fixed
                    && typeof ev != "function"
                    && (ev === null
                        || typeof ev != "object"
                        || compressor.option("unsafe_regexp")
                            && ev instanceof RegExp && !def.cross_loop && same_scope(def))) {
                    init = make_node_from_constant(ev, fixed);
                }
                if (init) {
                    if (!local && def.should_replace === undefined) {
                        var value_length = init.optimize(compressor).print_to_string().length;
                        if (!has_symbol_ref(fixed)) {
                            value_length = Math.min(value_length, fixed.print_to_string().length);
                        }
                        var name_length = def.name.length;
                        if (compressor.option("unused") && !compressor.exposed(def)) {
                            var referenced = def.references.length - def.replaced;
                            name_length += (name_length + 2 + value_length) / (referenced - def.assignments);
                        }
                        var delta = value_length - Math.floor(name_length);
                        def.should_replace = delta < compressor.eval_threshold;
                    }
                    if (local || def.should_replace) {
                        var value;
                        if (has_symbol_ref(fixed)) {
                            value = init.optimize(compressor);
                            if (value === init) value = value.clone(true);
                        } else {
                            value = best_of_expression(init.optimize(compressor), fixed);
                            if (value === init || value === fixed) value = value.clone(true);
                        }
                        def.replaced++;
                        return value;
                    }
                }
            }
        }
        return self;

        function has_symbol_ref(value) {
            var found;
            value.walk(new TreeWalker(function(node) {
                if (node instanceof AST_SymbolRef) found = true;
                if (found) return true;
            }));
            return found;
        }
    });

    function is_raw_tag(compressor, tag) {
        return compressor.option("unsafe")
            && tag instanceof AST_Dot
            && tag.property == "raw"
            && is_undeclared_ref(tag.expression)
            && tag.expression.name == "String";
    }

    OPT(AST_Template, function(self, compressor) {
        if (!compressor.option("templates")) return self;
        var tag = self.tag;
        if (!tag || is_raw_tag(compressor, tag)) {
            var exprs = self.expressions.slice();
            var strs = self.strings.slice();
            var CHANGED = false;
            for (var i = exprs.length; --i >= 0;) {
                var node = exprs[i];
                var ev = node.evaluate(compressor);
                if (ev === node) continue;
                if (tag && /\r|\\|`/.test(ev)) continue;
                ev = ("" + ev).replace(/\r|\\|`/g, function(s) {
                    return "\\" + (s == "\r" ? "r" : s);
                });
                if (ev.length > node.print_to_string().length + 3) continue;
                var combined = strs[i] + ev + strs[i + 1];
                if (typeof make_node(AST_Template, self, {
                    expressions: [],
                    strings: [ combined ],
                    tag: tag,
                }).evaluate(compressor) != typeof make_node(AST_Template, self, {
                    expressions: [ node ],
                    strings: strs.slice(i, i + 2),
                    tag: tag,
                }).evaluate(compressor)) continue;
                exprs.splice(i, 1);
                strs.splice(i, 2, combined);
                CHANGED = true;
            }
            if (CHANGED) {
                self.expressions = exprs;
                self.strings = strs;
            }
        }
        return try_evaluate(compressor, self);
    });

    function is_atomic(lhs, self) {
        return lhs instanceof AST_SymbolRef || lhs.TYPE === self.TYPE;
    }

    OPT(AST_Undefined, function(self, compressor) {
        if (compressor.option("unsafe_undefined")) {
            var undef = find_scope(compressor).find_variable("undefined");
            if (undef) {
                var ref = make_node(AST_SymbolRef, self, {
                    name   : "undefined",
                    scope  : undef.scope,
                    thedef : undef
                });
                ref.is_undefined = true;
                return ref;
            }
        }
        var lhs = is_lhs(compressor.self(), compressor.parent());
        if (lhs && is_atomic(lhs, self)) return self;
        return make_node(AST_UnaryPrefix, self, {
            operator: "void",
            expression: make_node(AST_Number, self, {
                value: 0
            })
        });
    });

    OPT(AST_Infinity, function(self, compressor) {
        var lhs = is_lhs(compressor.self(), compressor.parent());
        if (lhs && is_atomic(lhs, self)) return self;
        if (compressor.option("keep_infinity") && !lhs && !find_scope(compressor).find_variable("Infinity")) {
            return self;
        }
        return make_node(AST_Binary, self, {
            operator: "/",
            left: make_node(AST_Number, self, {
                value: 1
            }),
            right: make_node(AST_Number, self, {
                value: 0
            })
        });
    });

    OPT(AST_NaN, function(self, compressor) {
        var lhs = is_lhs(compressor.self(), compressor.parent());
        if (lhs && is_atomic(lhs, self)) return self;
        if (!lhs && !find_scope(compressor).find_variable("NaN")) return self;
        return make_node(AST_Binary, self, {
            operator: "/",
            left: make_node(AST_Number, self, {
                value: 0
            }),
            right: make_node(AST_Number, self, {
                value: 0
            })
        });
    });

    function is_reachable(self, defs) {
        var reachable = false;
        var find_ref = new TreeWalker(function(node) {
            if (reachable) return true;
            if (node instanceof AST_SymbolRef && member(node.definition(), defs)) {
                return reachable = true;
            }
        });
        var scan_scope = new TreeWalker(function(node) {
            if (reachable) return true;
            if (node instanceof AST_Lambda && node !== self) {
                if (!(node.name || is_async(node) || is_generator(node))) {
                    var parent = scan_scope.parent();
                    if (parent instanceof AST_Call && parent.expression === node) return;
                }
                node.walk(find_ref);
                return true;
            }
        });
        self.walk(scan_scope);
        return reachable;
    }

    var ASSIGN_OPS = makePredicate("+ - * / % >> << >>> | ^ &");
    var ASSIGN_OPS_COMMUTATIVE = makePredicate("* | ^ &");
    OPT(AST_Assign, function(self, compressor) {
        if (compressor.option("dead_code")) {
            if (self.left instanceof AST_PropAccess) {
                if (self.operator == "=") {
                    if (self.__drop) {
                        var exprs = [ self.left.expression ];
                        if (self.left instanceof AST_Sub) exprs.push(self.left.property);
                        exprs.push(self.right);
                        return make_sequence(self, exprs).optimize(compressor);
                    }
                    if (self.left.equivalent_to(self.right) && !self.left.has_side_effects(compressor)) {
                        return self.right;
                    }
                    var exp = self.left.expression;
                    if (exp instanceof AST_Lambda
                        || !compressor.has_directive("use strict")
                            && exp instanceof AST_Constant
                            && !exp.may_throw_on_access(compressor)) {
                        return self.left instanceof AST_Dot ? self.right : make_sequence(self, [
                            self.left.property,
                            self.right
                        ]).optimize(compressor);
                    }
                }
            } else if (self.left instanceof AST_SymbolRef && can_drop_symbol(self.left, compressor)) {
                var parent;
                if (self.operator == "=" && self.left.equivalent_to(self.right)
                    && !((parent = compressor.parent()) instanceof AST_UnaryPrefix && parent.operator == "delete")) {
                    return self.right;
                }
                if (self.left.is_immutable()) return strip_assignment();
                var def = self.left.definition();
                var scope = def.scope.resolve();
                var local = scope === compressor.find_parent(AST_Lambda);
                var level = 0, node;
                parent = compressor.self();
                do {
                    node = parent;
                    parent = compressor.parent(level++);
                    if (parent instanceof AST_Assign) {
                        var found = false;
                        if (parent.left.match_symbol(function(node) {
                            if (node instanceof AST_PropAccess) return true;
                            if (!found && node instanceof AST_SymbolRef && node.definition() === def) {
                                if (in_try(level, parent)) return true;
                                found = true;
                            }
                        })) break;
                        if (!found) continue;
                        return strip_assignment(def);
                    }
                    if (parent instanceof AST_Exit) {
                        if (!local) break;
                        if (in_try(level, parent)) break;
                        if (is_reachable(scope, [ def ])) break;
                        return strip_assignment(def);
                    }
                    if (parent instanceof AST_SimpleStatement) {
                        if (!local) break;
                        if (is_reachable(scope, [ def ])) break;
                        var stat;
                        do {
                            stat = parent;
                            parent = compressor.parent(level++);
                            if (parent === scope && is_last_statement(parent.body, stat)) return strip_assignment(def);
                        } while (is_tail_block(stat, parent));
                        break;
                    }
                    if (parent instanceof AST_VarDef) {
                        if (!(parent.name instanceof AST_SymbolDeclaration)) continue;
                        if (parent.name.definition() !== def) continue;
                        if (in_try(level, parent)) break;
                        return strip_assignment(def);
                    }
                } while (is_tail(node, parent));
            }
        }
        if (compressor.option("sequences")) {
            var seq = self.lift_sequences(compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        if (compressor.option("assignments")) {
            if (self.operator == "=" && self.left instanceof AST_SymbolRef && self.right instanceof AST_Binary) {
                // x = expr1 OP expr2
                if (self.right.left instanceof AST_SymbolRef
                    && self.right.left.name == self.left.name
                    && ASSIGN_OPS[self.right.operator]) {
                    // x = x - 2 ---> x -= 2
                    return make_node(AST_Assign, self, {
                        operator: self.right.operator + "=",
                        left: self.left,
                        right: self.right.right,
                    });
                }
                if (self.right.right instanceof AST_SymbolRef
                    && self.right.right.name == self.left.name
                    && ASSIGN_OPS_COMMUTATIVE[self.right.operator]
                    && !self.right.left.has_side_effects(compressor)) {
                    // x = 2 & x ---> x &= 2
                    return make_node(AST_Assign, self, {
                        operator: self.right.operator + "=",
                        left: self.left,
                        right: self.right.left,
                    });
                }
            }
            if ((self.operator == "-=" || self.operator == "+="
                    && (self.left.is_boolean(compressor) || self.left.is_number(compressor)))
                && self.right instanceof AST_Number
                && self.right.value == 1) {
                var op = self.operator.slice(0, -1);
                return make_node(AST_UnaryPrefix, self, {
                    operator: op + op,
                    expression: self.left
                });
            }
        }
        return try_evaluate(compressor, self);

        function is_tail(node, parent) {
            if (parent instanceof AST_Binary) {
                return parent.right === node || parent.right.is_constant_expression(scope);
            }
            if (parent instanceof AST_Conditional) {
                return parent.condition !== node
                    || parent.consequent.is_constant_expression(scope)
                        && parent.alternative.is_constant_expression(scope);
            }
            if (parent instanceof AST_Sequence) {
                var exprs = parent.expressions;
                var stop = exprs.indexOf(node);
                if (stop < 0) return false;
                for (var i = exprs.length; --i > stop;) {
                    if (!exprs[i].is_constant_expression(scope)) return false;
                }
                return true;
            }
            if (parent instanceof AST_UnaryPrefix) return true;
        }

        function is_tail_block(stat, parent) {
            if (parent instanceof AST_BlockStatement) return is_last_statement(parent.body, stat);
            if (parent instanceof AST_Catch) return is_last_statement(parent.body, stat);
            if (parent instanceof AST_Finally) return is_last_statement(parent.body, stat);
            if (parent instanceof AST_If) return parent.body === stat || parent.alternative === stat;
            if (parent instanceof AST_Try) return parent.bfinally ? parent.bfinally === stat : parent.bcatch === stat;
        }

        function in_try(level, node) {
            var right = self.right;
            self.right = make_node(AST_Null, right);
            var may_throw = node.may_throw(compressor);
            self.right = right;
            for (var parent; parent = compressor.parent(level++); node = parent) {
                if (parent === scope) return false;
                if (parent instanceof AST_Try) {
                    if (parent.bfinally && parent.bfinally !== node) return true;
                    if (may_throw && parent.bcatch && parent.bcatch !== node) return true;
                }
            }
        }

        function strip_assignment(def) {
            if (def) def.fixed = false;
            return (self.operator != "=" ? make_node(AST_Binary, self, {
                operator: self.operator.slice(0, -1),
                left: self.left,
                right: self.right,
            }) : maintain_this_binding(compressor, compressor.parent(), self, self.right)).optimize(compressor);
        }
    });

    OPT(AST_Conditional, function(self, compressor) {
        if (compressor.option("sequences") && self.condition instanceof AST_Sequence) {
            var expressions = self.condition.expressions.slice();
            self.condition = expressions.pop();
            expressions.push(self);
            return make_sequence(self, expressions);
        }
        if (!compressor.option("conditionals")) return self;
        var condition = self.condition;
        if (compressor.option("booleans") && !condition.has_side_effects(compressor)) {
            mark_duplicate_condition(compressor, condition);
        }
        condition = fuzzy_eval(compressor, condition);
        if (!condition) {
            AST_Node.warn("Condition always false [{file}:{line},{col}]", self.start);
            return make_sequence(self, [ self.condition, self.alternative ]).optimize(compressor);
        } else if (!(condition instanceof AST_Node)) {
            AST_Node.warn("Condition always true [{file}:{line},{col}]", self.start);
            return make_sequence(self, [ self.condition, self.consequent ]).optimize(compressor);
        }
        var negated = condition.negate(compressor, first_in_statement(compressor));
        if (best_of(compressor, condition, negated) === negated) {
            self = make_node(AST_Conditional, self, {
                condition: negated,
                consequent: self.alternative,
                alternative: self.consequent
            });
            negated = condition;
            condition = self.condition;
        }
        var consequent = self.consequent;
        var alternative = self.alternative;
        if (repeatable(compressor, condition)) {
            // x ? x : y ---> x || y
            if (condition.equivalent_to(consequent)) return make_node(AST_Binary, self, {
                operator: "||",
                left: condition,
                right: alternative,
            }).optimize(compressor);
            // x ? y : x ---> x && y
            if (condition.equivalent_to(alternative)) return make_node(AST_Binary, self, {
                operator: "&&",
                left: condition,
                right: consequent,
            }).optimize(compressor);
        }
        // if (foo) exp = something; else exp = something_else;
        //                   |
        //                   v
        // exp = foo ? something : something_else;
        var seq_tail = consequent.tail_node();
        if (seq_tail instanceof AST_Assign) {
            var is_eq = seq_tail.operator == "=";
            var alt_tail = is_eq ? alternative.tail_node() : alternative;
            if ((is_eq || consequent === seq_tail)
                && alt_tail instanceof AST_Assign
                && seq_tail.operator == alt_tail.operator
                && seq_tail.left.equivalent_to(alt_tail.left)
                && (is_eq && seq_tail.left instanceof AST_SymbolRef
                    || !condition.has_side_effects(compressor)
                        && can_shift_lhs_of_tail(consequent)
                        && can_shift_lhs_of_tail(alternative))) {
                return make_node(AST_Assign, self, {
                    operator: seq_tail.operator,
                    left: seq_tail.left,
                    right: make_node(AST_Conditional, self, {
                        condition: condition,
                        consequent: pop_lhs(consequent),
                        alternative: pop_lhs(alternative)
                    })
                });
            }
        }
        // x ? y : y ---> x, y
        if (consequent.equivalent_to(alternative)) return make_sequence(self, [
            condition,
            consequent
        ]).optimize(compressor);
        // x ? y.p : z.p ---> (x ? y : z).p
        // x ? y(a) : z(a) ---> (x ? y : z)(a)
        // x ? y.f(a) : z.f(a) ---> (x ? y : z).f(a)
        var combined = combine_tail(consequent, alternative, true);
        if (combined) return combined;
        // x ? y(a) : y(b) ---> y(x ? a : b)
        var arg_index;
        if (consequent instanceof AST_Call
            && alternative.TYPE == consequent.TYPE
            && (arg_index = arg_diff(consequent, alternative)) >= 0
            && consequent.expression.equivalent_to(alternative.expression)
            && !condition.has_side_effects(compressor)
            && !consequent.expression.has_side_effects(compressor)) {
            var node = consequent.clone();
            var arg = consequent.args[arg_index];
            node.args[arg_index] = arg instanceof AST_Spread ? make_node(AST_Spread, self, {
                expression: make_node(AST_Conditional, self, {
                    condition: condition,
                    consequent: arg.expression,
                    alternative: alternative.args[arg_index].expression,
                }),
            }) : make_node(AST_Conditional, self, {
                condition: condition,
                consequent: arg,
                alternative: alternative.args[arg_index],
            });
            return node;
        }
        // x ? (y ? a : b) : b ---> x && y ? a : b
        if (consequent instanceof AST_Conditional
            && consequent.alternative.equivalent_to(alternative)) {
            return make_node(AST_Conditional, self, {
                condition: make_node(AST_Binary, self, {
                    left: condition,
                    operator: "&&",
                    right: consequent.condition
                }),
                consequent: consequent.consequent,
                alternative: alternative
            });
        }
        // x ? (y ? a : b) : a ---> !x || y ? a : b
        if (consequent instanceof AST_Conditional
            && consequent.consequent.equivalent_to(alternative)) {
            return make_node(AST_Conditional, self, {
                condition: make_node(AST_Binary, self, {
                    left: negated,
                    operator: "||",
                    right: consequent.condition
                }),
                consequent: alternative,
                alternative: consequent.alternative
            });
        }
        // x ? a : (y ? a : b) ---> x || y ? a : b
        if (alternative instanceof AST_Conditional
            && consequent.equivalent_to(alternative.consequent)) {
            return make_node(AST_Conditional, self, {
                condition: make_node(AST_Binary, self, {
                    left: condition,
                    operator: "||",
                    right: alternative.condition
                }),
                consequent: consequent,
                alternative: alternative.alternative
            });
        }
        // x ? b : (y ? a : b) ---> !x && y ? a : b
        if (alternative instanceof AST_Conditional
            && consequent.equivalent_to(alternative.alternative)) {
            return make_node(AST_Conditional, self, {
                condition: make_node(AST_Binary, self, {
                    left: negated,
                    operator: "&&",
                    right: alternative.condition
                }),
                consequent: alternative.consequent,
                alternative: consequent
            });
        }
        // x ? (a, c) : (b, c) ---> x ? a : b, c
        if ((consequent instanceof AST_Sequence || alternative instanceof AST_Sequence)
            && consequent.tail_node().equivalent_to(alternative.tail_node())) {
            return make_sequence(self, [
                make_node(AST_Conditional, self, {
                    condition: condition,
                    consequent: pop_seq(consequent),
                    alternative: pop_seq(alternative)
                }),
                consequent.tail_node()
            ]).optimize(compressor);
        }
        // x ? y && a : a ---> (!x || y) && a
        if (consequent instanceof AST_Binary
            && consequent.operator == "&&"
            && consequent.right.equivalent_to(alternative)) {
            return make_node(AST_Binary, self, {
                operator: "&&",
                left: make_node(AST_Binary, self, {
                    operator: "||",
                    left: negated,
                    right: consequent.left
                }),
                right: alternative
            }).optimize(compressor);
        }
        // x ? y || a : a ---> x && y || a
        if (consequent instanceof AST_Binary
            && consequent.operator == "||"
            && consequent.right.equivalent_to(alternative)) {
            return make_node(AST_Binary, self, {
                operator: "||",
                left: make_node(AST_Binary, self, {
                    operator: "&&",
                    left: condition,
                    right: consequent.left
                }),
                right: alternative
            }).optimize(compressor);
        }
        // x ? a : y && a ---> (x || y) && a
        if (alternative instanceof AST_Binary
            && alternative.operator == "&&"
            && alternative.right.equivalent_to(consequent)) {
            return make_node(AST_Binary, self, {
                operator: "&&",
                left: make_node(AST_Binary, self, {
                    operator: "||",
                    left: condition,
                    right: alternative.left
                }),
                right: consequent
            }).optimize(compressor);
        }
        // x ? a : y || a ---> !x && y || a
        if (alternative instanceof AST_Binary
            && alternative.operator == "||"
            && alternative.right.equivalent_to(consequent)) {
            return make_node(AST_Binary, self, {
                operator: "||",
                left: make_node(AST_Binary, self, {
                    operator: "&&",
                    left: negated,
                    right: alternative.left
                }),
                right: consequent
            }).optimize(compressor);
        }
        var in_bool = compressor.option("booleans") && compressor.in_boolean_context();
        if (is_true(consequent)) {
            if (is_false(alternative)) {
                // c ? true : false ---> !!c
                return booleanize(condition);
            }
            // c ? true : x ---> !!c || x
            return make_node(AST_Binary, self, {
                operator: "||",
                left: booleanize(condition),
                right: alternative
            });
        }
        if (is_false(consequent)) {
            if (is_true(alternative)) {
                // c ? false : true ---> !c
                return booleanize(condition.negate(compressor));
            }
            // c ? false : x ---> !c && x
            return make_node(AST_Binary, self, {
                operator: "&&",
                left: booleanize(condition.negate(compressor)),
                right: alternative
            });
        }
        if (is_true(alternative)) {
            // c ? x : true ---> !c || x
            return make_node(AST_Binary, self, {
                operator: "||",
                left: booleanize(condition.negate(compressor)),
                right: consequent
            });
        }
        if (is_false(alternative)) {
            // c ? x : false ---> !!c && x
            return make_node(AST_Binary, self, {
                operator: "&&",
                left: booleanize(condition),
                right: consequent
            });
        }
        if (compressor.option("typeofs")) mark_locally_defined(condition, consequent, alternative);
        return self;

        function booleanize(node) {
            if (node.is_boolean(compressor)) return node;
            // !!expression
            return make_node(AST_UnaryPrefix, node, {
                operator: "!",
                expression: node.negate(compressor)
            });
        }

        // AST_True or !0
        function is_true(node) {
            return node instanceof AST_True
                || in_bool
                    && node instanceof AST_Constant
                    && node.value
                || (node instanceof AST_UnaryPrefix
                    && node.operator == "!"
                    && node.expression instanceof AST_Constant
                    && !node.expression.value);
        }
        // AST_False or !1 or void 0
        function is_false(node) {
            return node instanceof AST_False
                || in_bool
                    && (node instanceof AST_Constant
                            && !node.value
                        || node instanceof AST_UnaryPrefix
                            && node.operator == "void"
                            && !node.expression.has_side_effects(compressor))
                || (node instanceof AST_UnaryPrefix
                    && node.operator == "!"
                    && node.expression instanceof AST_Constant
                    && node.expression.value);
        }

        function arg_diff(consequent, alternative) {
            var a = consequent.args;
            var b = alternative.args;
            var len = a.length;
            if (len != b.length) return -2;
            for (var i = 0; i < len; i++) {
                if (!a[i].equivalent_to(b[i])) {
                    if (a[i] instanceof AST_Spread !== b[i] instanceof AST_Spread) return -3;
                    for (var j = i + 1; j < len; j++) {
                        if (!a[j].equivalent_to(b[j])) return -2;
                    }
                    return i;
                }
            }
            return -1;
        }

        function is_tail_equivalent(consequent, alternative) {
            if (consequent.TYPE != alternative.TYPE) return;
            if (consequent.optional != alternative.optional) return;
            if (consequent instanceof AST_Call) {
                if (arg_diff(consequent, alternative) != -1) return;
                return consequent.TYPE != "Call"
                    || !(consequent.expression instanceof AST_PropAccess
                        || alternative.expression instanceof AST_PropAccess)
                    || is_tail_equivalent(consequent.expression, alternative.expression);
            }
            if (!(consequent instanceof AST_PropAccess)) return;
            var p = consequent.property;
            var q = alternative.property;
            return (p instanceof AST_Node ? p.equivalent_to(q) : p == q)
                && !(consequent.expression instanceof AST_Super || alternative.expression instanceof AST_Super);
        }

        function combine_tail(consequent, alternative, top) {
            if (!is_tail_equivalent(consequent, alternative)) return !top && make_node(AST_Conditional, self, {
                condition: condition,
                consequent: consequent,
                alternative: alternative,
            });
            var node = consequent.clone();
            node.expression = combine_tail(consequent.expression, alternative.expression);
            return node;
        }

        function can_shift_lhs_of_tail(node) {
            return node === node.tail_node() || all(node.expressions.slice(0, -1), function(expr) {
                return !expr.has_side_effects(compressor);
            });
        }

        function pop_lhs(node) {
            if (!(node instanceof AST_Sequence)) return node.right;
            var exprs = node.expressions.slice();
            exprs.push(exprs.pop().right);
            return make_sequence(node, exprs);
        }

        function pop_seq(node) {
            if (!(node instanceof AST_Sequence)) return make_node(AST_Number, node, {
                value: 0
            });
            return make_sequence(node, node.expressions.slice(0, -1));
        }
    });

    OPT(AST_Boolean, function(self, compressor) {
        if (!compressor.option("booleans")) return self;
        if (compressor.in_boolean_context()) return make_node(AST_Number, self, {
            value: +self.value
        });
        var p = compressor.parent();
        if (p instanceof AST_Binary && (p.operator == "==" || p.operator == "!=")) {
            AST_Node.warn("Non-strict equality against boolean: {operator} {value} [{file}:{line},{col}]", {
                operator : p.operator,
                value    : self.value,
                file     : p.start.file,
                line     : p.start.line,
                col      : p.start.col,
            });
            return make_node(AST_Number, self, {
                value: +self.value
            });
        }
        return make_node(AST_UnaryPrefix, self, {
            operator: "!",
            expression: make_node(AST_Number, self, {
                value: 1 - self.value
            })
        });
    });

    OPT(AST_Spread, function(self, compressor) {
        var exp = self.expression;
        if (compressor.option("spreads") && exp instanceof AST_Array && !(compressor.parent() instanceof AST_Object)) {
            return List.splice(exp.elements.map(function(node) {
                return node instanceof AST_Hole ? make_node(AST_Undefined, node).optimize(compressor) : node;
            }));
        }
        return self;
    });

    function safe_to_flatten(value, compressor) {
        if (!value) return false;
        var parent = compressor.parent();
        if (parent.TYPE != "Call") return true;
        if (parent.expression !== compressor.self()) return true;
        if (value instanceof AST_SymbolRef) {
            value = value.fixed_value();
            if (!value) return false;
        }
        return value instanceof AST_Lambda && !value.contains_this();
    }

    OPT(AST_Sub, function(self, compressor) {
        var expr = self.expression;
        var prop = self.property;
        var terminated = trim_optional_chain(self, compressor);
        if (terminated) return terminated;
        if (compressor.option("properties")) {
            var key = prop.evaluate(compressor);
            if (key !== prop) {
                if (typeof key == "string") {
                    if (key == "undefined") {
                        key = undefined;
                    } else {
                        var value = parseFloat(key);
                        if (value.toString() == key) {
                            key = value;
                        }
                    }
                }
                prop = self.property = best_of_expression(prop, make_node_from_constant(key, prop).transform(compressor));
                var property = "" + key;
                if (is_identifier_string(property)
                    && property.length <= prop.print_to_string().length + 1) {
                    return make_node(AST_Dot, self, {
                        optional: self.optional,
                        expression: expr,
                        property: property,
                    }).optimize(compressor);
                }
            }
        }
        var parent = compressor.parent();
        var assigned = is_lhs(compressor.self(), parent);
        var def, fn, fn_parent, index;
        if (compressor.option("arguments")
            && expr instanceof AST_SymbolRef
            && is_arguments(def = expr.definition())
            && !expr.in_arg
            && prop instanceof AST_Number
            && Math.floor(index = prop.value) == index
            && (fn = def.scope) === find_lambda()
            && fn.uses_arguments < (assigned ? 2 : 3)) {
            if (parent instanceof AST_UnaryPrefix && parent.operator == "delete") {
                if (!def.deleted) def.deleted = [];
                def.deleted[index] = true;
            }
            var argname = fn.argnames[index];
            if (def.deleted && def.deleted[index]) {
                argname = null;
            } else if (argname) {
                var arg_def;
                if (!(argname instanceof AST_SymbolFunarg)
                    || argname.name == "await"
                    || expr.scope.find_variable(argname.name) !== (arg_def = argname.definition())) {
                    argname = null;
                } else if (compressor.has_directive("use strict")
                    || fn.name
                    || fn.rest
                    || !(fn_parent instanceof AST_Call
                        && index < fn_parent.args.length
                        && all(fn_parent.args.slice(0, index + 1), function(arg) {
                            return !(arg instanceof AST_Spread);
                        }))
                    || !all(fn.argnames, function(argname) {
                        return argname instanceof AST_SymbolFunarg;
                    })) {
                    if (has_reassigned() || arg_def.assignments || arg_def.orig.length > 1) argname = null;
                }
            } else if ((assigned || !has_reassigned())
                && index < fn.argnames.length + 5
                && compressor.drop_fargs(fn, fn_parent)
                && !fn.rest) {
                while (index >= fn.argnames.length) {
                    argname = fn.make_var(AST_SymbolFunarg, fn, "argument_" + fn.argnames.length);
                    fn.argnames.push(argname);
                }
            }
            if (argname && find_if(function(node) {
                return node.name === argname.name;
            }, fn.argnames) === argname) {
                if (assigned) def.reassigned--;
                var sym = make_node(AST_SymbolRef, self, argname);
                sym.reference();
                delete argname.__unused;
                return sym;
            }
        }
        if (assigned) return self;
        if (compressor.option("sequences")
            && parent.TYPE != "Call"
            && !(parent instanceof AST_ForEnumeration && parent.init === self)) {
            var seq = lift_sequence_in_expression(self, compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        if (key !== prop) {
            var sub = self.flatten_object(property, compressor);
            if (sub) {
                expr = self.expression = sub.expression;
                prop = self.property = sub.property;
            }
        }
        var elements;
        if (compressor.option("properties")
            && compressor.option("side_effects")
            && prop instanceof AST_Number
            && expr instanceof AST_Array
            && all(elements = expr.elements, function(value) {
                return !(value instanceof AST_Spread);
            })) {
            var index = prop.value;
            var retValue = elements[index];
            if (safe_to_flatten(retValue, compressor)) {
                var is_hole = retValue instanceof AST_Hole;
                var flatten = !is_hole;
                var values = [];
                for (var i = elements.length; --i > index;) {
                    var value = elements[i].drop_side_effect_free(compressor);
                    if (value) {
                        values.unshift(value);
                        if (flatten && value.has_side_effects(compressor)) flatten = false;
                    }
                }
                if (!flatten) values.unshift(retValue);
                while (--i >= 0) {
                    var value = elements[i].drop_side_effect_free(compressor);
                    if (value) {
                        values.unshift(value);
                    } else if (is_hole) {
                        values.unshift(make_node(AST_Hole, elements[i]));
                    } else {
                        index--;
                    }
                }
                if (flatten) {
                    values.push(retValue);
                    return make_sequence(self, values).optimize(compressor);
                } else return make_node(AST_Sub, self, {
                    expression: make_node(AST_Array, expr, { elements: values }),
                    property: make_node(AST_Number, prop, { value: index }),
                });
            }
        }
        return try_evaluate(compressor, self);

        function find_lambda() {
            var i = 0, p;
            while (p = compressor.parent(i++)) {
                if (p instanceof AST_Lambda) {
                    if (p instanceof AST_Accessor) return;
                    if (is_arrow(p)) continue;
                    fn_parent = compressor.parent(i);
                    return p;
                }
            }
        }

        function has_reassigned() {
            return !compressor.option("reduce_vars") || def.reassigned;
        }
    });

    AST_Arrow.DEFMETHOD("contains_super", return_false);
    AST_AsyncArrow.DEFMETHOD("contains_super", return_false);
    AST_Lambda.DEFMETHOD("contains_super", function() {
        var result;
        var self = this;
        self.walk(new TreeWalker(function(node) {
            if (result) return true;
            if (node instanceof AST_Super) return result = true;
            if (node !== self && node instanceof AST_Scope && !is_arrow(node)) return true;
        }));
        return result;
    });
    AST_LambdaDefinition.DEFMETHOD("contains_super", return_false);
    AST_Scope.DEFMETHOD("contains_super", return_false);

    AST_Arrow.DEFMETHOD("contains_this", return_false);
    AST_AsyncArrow.DEFMETHOD("contains_this", return_false);
    AST_Node.DEFMETHOD("contains_this", function() {
        var result;
        var self = this;
        self.walk(new TreeWalker(function(node) {
            if (result) return true;
            if (node instanceof AST_This) return result = true;
            if (node !== self && node instanceof AST_Scope && !is_arrow(node)) return true;
        }));
        return result;
    });

    function can_hoist_property(prop) {
        return prop instanceof AST_ObjectKeyVal
            && typeof prop.key == "string"
            && !(prop instanceof AST_ObjectMethod && prop.value.contains_super());
    }

    AST_PropAccess.DEFMETHOD("flatten_object", function(key, compressor) {
        if (!compressor.option("properties")) return;
        if (key === "__proto__") return;
        var expr = this.expression;
        if (expr instanceof AST_Object) {
            var props = expr.properties;
            for (var i = props.length; --i >= 0;) {
                var prop = props[i];
                if (prop.key !== key) continue;
                if (!all(props, can_hoist_property)) break;
                if (!safe_to_flatten(prop.value, compressor)) break;
                props = props.map(function(prop) {
                    return prop.value;
                });
                if (prop instanceof AST_ObjectMethod
                    && prop.value instanceof AST_Function
                    && !(compressor.parent() instanceof AST_Call)) {
                    if (prop.value.uses_arguments) break;
                    props[i] = make_node(AST_Arrow, prop.value, prop.value);
                }
                return make_node(AST_Sub, this, {
                    expression: make_node(AST_Array, expr, { elements: props }),
                    property: make_node(AST_Number, this, { value: i }),
                });
            }
        }
    });

    OPT(AST_Dot, function(self, compressor) {
        if (self.property == "arguments" || self.property == "caller") {
            AST_Node.warn("Function.prototype.{prop} not supported [{file}:{line},{col}]", {
                prop: self.property,
                file: self.start.file,
                line: self.start.line,
                col: self.start.col,
            });
        }
        var parent = compressor.parent();
        if (is_lhs(compressor.self(), parent)) return self;
        var terminated = trim_optional_chain(self, compressor);
        if (terminated) return terminated;
        if (compressor.option("sequences")
            && parent.TYPE != "Call"
            && !(parent instanceof AST_ForEnumeration && parent.init === self)) {
            var seq = lift_sequence_in_expression(self, compressor);
            if (seq !== self) return seq.optimize(compressor);
        }
        if (compressor.option("unsafe_proto")
            && self.expression instanceof AST_Dot
            && self.expression.property == "prototype") {
            var exp = self.expression.expression;
            if (is_undeclared_ref(exp)) switch (exp.name) {
              case "Array":
                self.expression = make_node(AST_Array, self.expression, {
                    elements: []
                });
                break;
              case "Function":
                self.expression = make_node(AST_Function, self.expression, {
                    argnames: [],
                    body: []
                }).init_vars(exp.scope);
                break;
              case "Number":
                self.expression = make_node(AST_Number, self.expression, {
                    value: 0
                });
                break;
              case "Object":
                self.expression = make_node(AST_Object, self.expression, {
                    properties: []
                });
                break;
              case "RegExp":
                self.expression = make_node(AST_RegExp, self.expression, {
                    value: /t/
                });
                break;
              case "String":
                self.expression = make_node(AST_String, self.expression, {
                    value: ""
                });
                break;
            }
        }
        var sub = self.flatten_object(self.property, compressor);
        if (sub) return sub.optimize(compressor);
        return try_evaluate(compressor, self);
    });

    OPT(AST_DestructuredArray, function(self, compressor) {
        if (compressor.option("rests") && self.rest instanceof AST_DestructuredArray) {
            self.elements = self.elements.concat(self.rest.elements);
            self.rest = self.rest.rest;
        }
        return self;
    });

    OPT(AST_DestructuredKeyVal, function(self, compressor) {
        if (compressor.option("objects")) {
            var key = self.key;
            if (key instanceof AST_Node) {
                key = key.evaluate(compressor);
                if (key !== self.key) self.key = "" + key;
            }
        }
        return self;
    });

    OPT(AST_Object, function(self, compressor) {
        if (!compressor.option("objects")) return self;
        var changed = false;
        var found = false;
        var generated = false;
        var keep_duplicate = compressor.has_directive("use strict");
        var keys = new Dictionary();
        var values = [];
        self.properties.forEach(function(prop) {
            if (!(prop instanceof AST_Spread)) return process(prop);
            found = true;
            var exp = prop.expression;
            if (compressor.option("spreads") && exp instanceof AST_Object && all(exp.properties, function(prop) {
                if (prop instanceof AST_ObjectGetter) return false;
                if (prop instanceof AST_Spread) return false;
                if (prop.key !== "__proto__") return true;
                if (prop instanceof AST_ObjectSetter) return true;
                return !prop.value.has_side_effects(compressor);
            })) {
                changed = true;
                exp.properties.forEach(function(prop) {
                    var key = prop.key;
                    var setter = prop instanceof AST_ObjectSetter;
                    if (key === "__proto__") {
                        if (!setter) return;
                        key = make_node_from_constant(key, prop);
                    }
                    process(setter ? make_node(AST_ObjectKeyVal, prop, {
                        key: key,
                        value: make_node(AST_Undefined, prop).optimize(compressor),
                    }) : prop);
                });
            } else {
                generated = true;
                flush();
                values.push(prop);
            }
        });
        flush();
        if (!changed) return self;
        if (found && generated && values.length == 1) {
            var value = values[0];
            if (value instanceof AST_ObjectProperty && value.key instanceof AST_Number) {
                value.key = "" + value.key.value;
            }
        }
        return make_node(AST_Object, self, { properties: values });

        function flush() {
            keys.each(function(props) {
                if (props.length == 1) return values.push(props[0]);
                changed = true;
                var tail = keep_duplicate && !generated && props.pop();
                values.push(props.length == 1 ? props[0] : make_node(AST_ObjectKeyVal, self, {
                    key: props[0].key,
                    value: make_sequence(self, props.map(function(prop) {
                        return prop.value;
                    }))
                }));
                if (tail) values.push(tail);
            });
            keys = new Dictionary();
        }

        function process(prop) {
            var key = prop.key;
            if (key instanceof AST_Node) {
                found = true;
                key = key.evaluate(compressor);
                if (key === prop.key || key === "__proto__") {
                    generated = true;
                } else {
                    key = prop.key = "" + key;
                }
            }
            if (can_hoist_property(prop)) {
                if (prop.value.has_side_effects(compressor)) flush();
                keys.add(key, prop);
            } else {
                flush();
                values.push(prop);
            }
            if (found && !generated && typeof key == "string" && RE_POSITIVE_INTEGER.test(key)) {
                generated = true;
                if (keys.has(key)) prop = keys.get(key)[0];
                prop.key = make_node(AST_Number, prop, { value: +key });
            }
        }
    });

    OPT(AST_Return, function(self, compressor) {
        if (compressor.option("side_effects")
            && self.value
            && is_undefined(self.value, compressor)
            && !in_async_generator(compressor.find_parent(AST_Scope))) {
            self.value = null;
        }
        return self;
    });
})(function(node, optimizer) {
    node.DEFMETHOD("optimize", function(compressor) {
        var self = this;
        if (self._optimized) return self;
        if (compressor.has_directive("use asm")) return self;
        var opt = optimizer(self, compressor);
        opt._optimized = true;
        return opt;
    });
});

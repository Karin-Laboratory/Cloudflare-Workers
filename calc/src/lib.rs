//! Dependency-free expression parser and raw WebAssembly ABI.
use std::f64::consts::{E, PI};
type Answer = Result<f64, &'static str>;

struct Parser<'a> {
    bytes: &'a [u8],
    pos: usize,
    depth: usize,
    degrees: bool,
}
impl Parser<'_> {
    fn space(&mut self) {
        while self.bytes.get(self.pos).is_some_and(u8::is_ascii_whitespace) {
            self.pos += 1;
        }
    }
    fn eat(&mut self, c: u8) -> bool {
        self.space();
        if self.bytes.get(self.pos) == Some(&c) {
            self.pos += 1;
            true
        } else {
            false
        }
    }
    fn expr(&mut self, min: u8) -> Answer {
        self.depth += 1;
        if self.depth > 64 {
            return Err("式の入れ子が深すぎます");
        }
        let result = self.inner(min);
        self.depth -= 1;
        result
    }
    fn inner(&mut self, min: u8) -> Answer {
        let mut left = if self.eat(b'+') {
            self.expr(5)?
        } else if self.eat(b'-') {
            -self.expr(5)?
        } else {
            self.atom()?
        };
        loop {
            self.space();
            let op = self.bytes.get(self.pos).copied().unwrap_or(0);
            if matches!(op, b'!' | b'%') {
                if 9 < min { break; }
                self.pos += 1;
                left = if op == b'%' { left / 100.0 } else { factorial(left)? };
                continue;
            }
            let (lb, rb) = match op {
                b'+' | b'-' => (1, 2),
                b'*' | b'/' => (3, 4),
                b'^' => (7, 6),
                _ => break,
            };
            if lb < min { break; }
            self.pos += 1;
            let right = self.expr(rb)?;
            left = match op {
                b'+' => left + right,
                b'-' => left - right,
                b'*' => left * right,
                b'/' if right == 0.0 => return Err("0では割れません"),
                b'/' => left / right,
                _ => left.powf(right),
            };
            finite(left)?;
        }
        finite(left)
    }
    fn atom(&mut self) -> Answer {
        if self.eat(b'(') {
            let value = self.expr(0)?;
            if !self.eat(b')') { return Err("閉じ括弧が必要です"); }
            return Ok(value);
        }
        self.space();
        let start = self.pos;
        while self.bytes.get(self.pos).is_some_and(u8::is_ascii_alphabetic) {
            self.pos += 1;
        }
        if start != self.pos {
            let name = std::str::from_utf8(&self.bytes[start..self.pos]).unwrap();
            match name {
                "pi" => return Ok(PI),
                "e" => return Ok(E),
                _ => (),
            }
            if !self.eat(b'(') { return Err("関数には括弧が必要です"); }
            let x = self.expr(0)?;
            if !self.eat(b')') { return Err("閉じ括弧が必要です"); }
            let angle = if self.degrees { x.to_radians() } else { x };
            return finite(match name {
                "sin" => angle.sin(),
                "cos" => angle.cos(),
                "tan" if angle.cos().abs() < 1e-14 => return Err("tanの定義域外です"),
                "tan" => angle.tan(),
                "sqrt" => x.sqrt(),
                "ln" => x.ln(),
                "log" => x.log10(),
                "abs" => x.abs(),
                "exp" => x.exp(),
                _ => return Err("未知の関数です"),
            });
        }
        while self.bytes.get(self.pos).is_some_and(|c| c.is_ascii_digit() || *c == b'.') {
            self.pos += 1;
        }
        // Scientific notation; an isolated e remains Euler's constant.
        if self.pos > start && matches!(self.bytes.get(self.pos), Some(b'e' | b'E')) {
            self.pos += 1;
            if matches!(self.bytes.get(self.pos), Some(b'+' | b'-')) { self.pos += 1; }
            while self.bytes.get(self.pos).is_some_and(u8::is_ascii_digit) { self.pos += 1; }
        }
        std::str::from_utf8(&self.bytes[start..self.pos]).ok()
            .and_then(|s| s.parse::<f64>().ok()).ok_or("数値または式を入力してください")
            .and_then(finite)
    }
}
fn finite(x: f64) -> Answer {
    if x.is_finite() { Ok(x) } else { Err("定義域外、または桁あふれです") }
}
fn factorial(x: f64) -> Answer {
    if !(0.0..=170.0).contains(&x) || x.fract() != 0.0 {
        return Err("階乗は0〜170の整数で指定してください");
    }
    Ok((1..=x as u32).fold(1.0, |a, n| a * n as f64))
}
pub fn evaluate(input: &str, degrees: bool) -> Answer {
    if input.len() > 4096 { return Err("式が長すぎます"); }
    let mut parser = Parser { bytes: input.as_bytes(), pos: 0, depth: 0, degrees };
    let value = parser.expr(0)?;
    parser.space();
    if parser.pos != parser.bytes.len() { return Err("式を確認してください（乗算は *）"); }
    Ok(value)
}
fn display(x: f64) -> String {
    if x == 0.0 { return "0".into(); }
    // 15 significant digits hide ordinary binary floating-point display noise.
    let scientific = format!("{:.14e}", x);
    let (mantissa, exponent) = scientific.split_once('e').unwrap();
    let exponent: i32 = exponent.parse().unwrap();
    if !(-8..15).contains(&exponent) {
        format!("{}e{}", mantissa.trim_end_matches('0').trim_end_matches('.'), exponent)
    } else {
        let decimals = (14 - exponent).max(0) as usize;
        let text = format!("{:.*}", decimals, x);
        if text.contains('.') { text.trim_end_matches('0').trim_end_matches('.').into() } else { text }
    }
}
// ABI ownership: JS frees both input and output with their exact byte lengths.
#[no_mangle]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    Box::into_raw(vec![0u8; len].into_boxed_slice()) as *mut u8
}
/// # Safety
/// ptr/len must identify a live allocation returned by alloc or calculate.
#[no_mangle]
pub unsafe extern "C" fn release(ptr: *mut u8, len: usize) {
    drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, len)));
}
static mut OUTPUT_LEN: usize = 0;
#[no_mangle]
pub extern "C" fn output_len() -> usize { unsafe { OUTPUT_LEN } }
/// # Safety
/// ptr/len must identify initialized input bytes in a live allocation.
#[no_mangle]
pub unsafe extern "C" fn calculate(ptr: *const u8, len: usize, degrees: u32) -> *mut u8 {
    let answer = std::str::from_utf8(std::slice::from_raw_parts(ptr, len))
        .map_err(|_| "文字コードを確認してください")
        .and_then(|s| evaluate(s, degrees != 0));
    let text = match answer { Ok(x) => display(x), Err(e) => format!("Error: {e}") };
    let bytes = text.into_bytes().into_boxed_slice();
    OUTPUT_LEN = bytes.len();
    Box::into_raw(bytes) as *mut u8
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn arithmetic() {
        for (s, want) in [("1+2*3",7.0),("(1+2)*3",9.0),("-2^2",-4.0),
            ("2^-2",0.25),("2^3^2",512.0),("5!",120.0),("200*10%",20.0),
            ("sqrt(81)+abs(-2)",11.0),("1e-3*2",0.002),("0!",1.0)] {
            assert!((evaluate(s,true).unwrap()-want).abs()<1e-12,"{s}");
        }
    }
    #[test]
    fn functions_and_precision() {
        assert!((evaluate("sin(30)",true).unwrap()-0.5).abs()<1e-12);
        assert!((evaluate("sin(pi/2)",false).unwrap()-1.0).abs()<1e-12);
        assert_eq!(display(evaluate("0.1+0.2",true).unwrap()),"0.3");
        assert_eq!(display(1e20),"1e20");
        assert_eq!(display(1e-10),"1e-10");
    }
    #[test]
    fn errors_and_limits() {
        for s in ["1/0","sqrt(-1)","ln(0)","tan(90)","171!","(-1)!","2(3)","1..2","(2","2+","alert(1)","1e999"] {
            assert!(evaluate(s,true).is_err(),"{s}");
        }
        assert!(evaluate(&"(".repeat(100),true).is_err());
        assert!(evaluate(&"1".repeat(4097),true).is_err());
    }
}
